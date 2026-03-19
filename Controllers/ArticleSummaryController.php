<?php

/**
 * Article Summary Controller
 * 文章总结控制器
 */
final class FreshExtension_ArticleSummary_Controller extends Minz_ActionController {
  /**
   * Handle the summarize action
   * 处理总结动作
   */
  public function summarizeAction(): void {
    // Start output buffering to prevent output before header() call
    // This is essential for JSON API responses because header() must be called before any output
    // $this->view->_layout(false) may trigger some output, causing "headers already sent" error
    // 开启输出缓冲区，防止在调用 header() 之前有输出
    // 这对于 JSON API 响应是必要的，因为 header() 必须在任何输出之前调用
    // $this->view->_layout(false) 可能会触发某些输出，导致 headers already sent 错误
    ob_start();
    
    $this->view->_layout(false);
    header('Content-Type: application/json');

    // Get configuration values from user settings
    // 从用户设置中获取配置值
    $oai_url = FreshRSS_Context::$user_conf->oai_url;
    $oai_key = FreshRSS_Context::$user_conf->oai_key;
    $oai_model = FreshRSS_Context::$user_conf->oai_model;
    $oai_prompt = FreshRSS_Context::$user_conf->oai_prompt;
    $oai_provider = FreshRSS_Context::$user_conf->oai_provider;

    // Check if all required configurations are provided
    // 检查是否提供了所有必要的配置
    if (
      $this->isEmpty($oai_url)
      || ($this->isEmpty($oai_key) && $oai_provider !== 'ollama')
      || $this->isEmpty($oai_model)
      || $this->isEmpty($oai_prompt)
    ) {
      echo json_encode(array(
        'response' => array(
          'data' => 'missing config',
          'error' => 'configuration'
        ),
        'status' => 200
      ));
      return;
    }

    // Get article ID from request and fetch the article
    // 从请求中获取文章ID并获取文章
    $entry_id = Minz_Request::param('id');
    $entry_dao = FreshRSS_Factory::createEntryDao();
    $entry = $entry_dao->searchById($entry_id);

    if ($entry === null) {
      echo json_encode(array('status' => 404));
      return;
    }

    $title = $entry->title(); // Get article title
    $author = $entry->author(); // Get article author
    $content = $entry->content(); // Get article content

    // Process API URL - add version if missing (only for OpenAI)
    // 处理API URL - 如果缺少版本则添加（仅针对OpenAI）
    $oai_url = rtrim($oai_url, '/'); // Remove trailing slash
    if (!preg_match('/\/v\d+(beta)?\/?$/', $oai_url)) {
      if ($oai_provider === "gemini") {
        $oai_url .= '/v1beta'; // Gemini heavily relies on v1beta for features like systemInstruction
      } elseif ($oai_provider !== "ollama") {
        $oai_url .= '/v1'; // Default to /v1 for OpenAI compatible APIs
      }
    }
    
    // Prepare OpenAI API response
    // 准备OpenAI API响应
    $successResponse = array(
      'response' => array(
        'data' => array(
          "oai_url" => $oai_url . '/chat/completions',
          "oai_key" => $oai_key,
          "model" => $oai_model,
          "messages" => [
            [
              "role" => "system",
              "content" => $oai_prompt
            ],
            [
              "role" => "user",
              "content" => "Title: " . $title . "\nAuthor: " . $author . "\n\nContent: " . $this->htmlToMarkdown($content),
            ]
          ],
          "max_tokens" => 2048, // You can adjust the length of the summary as needed
          "temperature" => 0.7, // You can adjust the randomness/temperature of the generated text as needed
          "n" => 1, // Generate summary
          "stream" => true
        ),
        'provider' => 'openai',
        'error' => null
      ),
      'status' => 200
    );

    // Prepare Ollama API response if selected
    // 如果选择了Ollama API，则准备Ollama API响应
    if ($oai_provider === "ollama") {
      $successResponse = array(
        'response' => array(
          'data' => array(
            "oai_url" => rtrim($oai_url, '/') . '/api/generate',
            "oai_key" => $oai_key,
            "model" => $oai_model,
            "system" => $oai_prompt,
            "prompt" =>  "Title: " . $title . "\nAuthor: " . $author . "\n\nContent: " . $this->htmlToMarkdown($content),
            "stream" => true,
          ),
          'provider' => 'ollama',
          'error' => null
        ),
        'status' => 200
      );
    }

    // Prepare Gemini API response if selected
    // 如果选择了Gemini API，则准备Gemini API响应
    if ($oai_provider === "gemini") {
      $oai_url = rtrim($oai_url, '/');
      $successResponse = array(
        'response' => array(
          'data' => array(
            "oai_url" => $oai_url . '/models/' . $oai_model . ':streamGenerateContent',
            "oai_key" => $oai_key,
            "model" => $oai_model,
            "systemInstruction" => $oai_prompt,
            "prompt" => "Title: " . $title . "\nAuthor: " . $author . "\n\nContent: " . $this->htmlToMarkdown($content),
          ),
          'provider' => 'gemini',
          'error' => null
        ),
        'status' => 200
      );
    }

    // Send response
    // 发送响应
    echo json_encode($successResponse);
    return;
  }

  /**
   * Check if a value is empty
   * 检查值是否为空
   * 
   * @param mixed $item The value to check
   * @return bool True if the value is null, false otherwise
   */
  private function isEmpty(mixed $item): bool {
    return $item === null;
  }

  /**
   * Convert HTML content to Markdown format
   * 将HTML内容转换为Markdown格式
   * 
   * @param string $content HTML content to convert
   * @return string Markdown formatted content
   */
  private function htmlToMarkdown(string $content): string {
    // Create DOMDocument object
    $dom = new DOMDocument();
    libxml_use_internal_errors(true); // Ignore HTML parsing errors
    $dom->loadHTML('<?xml encoding="UTF-8">' . $content);
    libxml_clear_errors();

    // Create XPath object
    $xpath = new DOMXPath($dom);

    // Get all nodes
    $nodes = $xpath->query('//body/*');

    // Process all nodes
    $markdown = '';
    foreach ($nodes as $node) {
      $markdown .= $this->processNode($node, $xpath);
    }

    // Remove extra line breaks
    $markdown = preg_replace('/(\n){3,}/', "\n\n", $markdown);
    
    return $markdown;
  }

  /**
   * Process a single DOM node and convert it to Markdown
   * 处理单个DOM节点并将其转换为Markdown
   * 
   * @param DOMNode $node The DOM node to process
   * @param DOMXPath $xpath XPath object for querying nodes
   * @param int $indentLevel Indentation level for nested elements
   * @return string Markdown formatted content
   */
  private function processNode(DOMNode $node, DOMXPath $xpath, int $indentLevel = 0): string {
    $markdown = '';

    // Process text nodes
    if ($node->nodeType === XML_TEXT_NODE) {
      // Normalize whitespace to single space, don't completely remove
      $markdown .= preg_replace('/\s+/', ' ', $node->nodeValue);
    }

    // Process element nodes
    if ($node->nodeType === XML_ELEMENT_NODE) {
      switch ($node->nodeName) {
        case 'p':
        case 'div':
          foreach ($node->childNodes as $child) {
            $markdown .= $this->processNode($child, $xpath, $indentLevel);
          }
          $markdown .= "\n\n";
          break;
        case 'h1':
          $markdown .= "# ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'h2':
          $markdown .= "## ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'h3':
          $markdown .= "### ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'h4':
          $markdown .= "#### ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'h5':
          $markdown .= "##### ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'h6':
          $markdown .= "###### ";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "\n\n";
          break;
        case 'a':
          // Convert links to code-style text instead of markdown links
          // 将链接转换为代码风格的文本而不是markdown链接
          $markdown .= "`";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "`";
          break;
        case 'img':
          $alt = $node->getAttribute('alt');
          $markdown .= "img: `" . $alt . "`";
          break;
        case 'strong':
        case 'b':
          $markdown .= "**";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "**";
          break;
        case 'em':
        case 'i':
          $markdown .= "*";
          $markdown .= $this->processNode($node->firstChild, $xpath);
          $markdown .= "*";
          break;
        case 'ul':
        case 'ol':
          $markdown .= "\n";
          foreach ($node->childNodes as $child) {
            if ($child->nodeName === 'li') {
              $markdown .= str_repeat("  ", $indentLevel) . "- ";
              $markdown .= $this->processNode($child, $xpath, $indentLevel + 1);
              $markdown .= "\n";
            }
          }
          $markdown .= "\n";
          break;
        case 'li':
          // Only process children - the parent ul/ol handles the bullet and newline
          foreach ($node->childNodes as $child) {
            $markdown .= $this->processNode($child, $xpath, $indentLevel + 1);
          }
          break;
        case 'br':
          $markdown .= "\n";
          break;
        case 'audio':
        case 'video':
          $alt = $node->getAttribute('alt');
          $markdown .= "[" . ($alt ? $alt : 'Media') . "]";
          break;
        default:
          // Tags not considered, only the text inside is kept
          // 不处理的标签，只保留内部文本
          foreach ($node->childNodes as $child) {
            $markdown .= $this->processNode($child, $xpath, $indentLevel);
          }
          break;
      }
    }

    return $markdown;
  }
}