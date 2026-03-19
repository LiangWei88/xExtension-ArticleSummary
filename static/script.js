/**
 * Article Summary Extension - Frontend JavaScript
 * Article Summary Extension - 前端JavaScript
 */

// Initialize summarize buttons when DOM is loaded
// 当DOM加载完成时初始化总结按钮
if (document.readyState && document.readyState !== 'loading') {
  configureSummarizeButtons();
} else {
  document.addEventListener('DOMContentLoaded', configureSummarizeButtons, false);
}

/**
 * Configure event listeners for summarize buttons
 * 为总结按钮配置事件监听器
 */
function configureSummarizeButtons() {
  document.getElementById('global').addEventListener('click', function (e) {
    for (var target = e.target; target && target != this; target = target.parentNode) {
      
      // Handle article header click to add text to summary button
      // 处理文章标题点击，为总结按钮添加文本
      if (target.matches('.flux_header')) {
        const button = target.nextElementSibling.querySelector('.oai-summary-btn');
        button.innerHTML = button.dataset.summarizeText;
      }

      // Handle summarize button click
      // 处理总结按钮点击
      if (target.matches('.oai-summary-btn')) {
        e.preventDefault();
        e.stopPropagation();
        if (target.dataset.request) {
          summarizeButtonClick(target);
        }
        break;
      }
    }
  }, false);
}

/**
 * Set the state of the AI summary component
 * 设置AI总结组件的状态
 * 
 * @param {HTMLElement} container - The summary container element
 * @param {number} statusType - Status type: 1=loading, 2=error, 0=success
 * @param {string} statusMsg - Status message to display
 * @param {string} summaryText - Summary text to display when completed
 */
function setOaiState(container, statusType, statusMsg, summaryText) {
  const button = container.querySelector('.oai-summary-btn');
  const content = container.querySelector('.oai-summary-content');
  
  // Set different states based on statusType
  // 根据statusType设置不同状态
  if (statusType === 1) {
    // Loading state
    // 加载状态
    container.classList.add('oai-loading');
    container.classList.remove('oai-error');
    content.innerHTML = statusMsg;
    button.disabled = true;
  } else if (statusType === 2) {
    // Error state
    // 错误状态
    container.classList.remove('oai-loading');
    container.classList.add('oai-error');
    content.innerHTML = statusMsg;
    button.disabled = false;
  } else {
    // Success state
    // 成功状态
    container.classList.remove('oai-loading');
    container.classList.remove('oai-error');
    if (statusMsg === 'finish'){
      button.disabled = false;
    }
  }

  // Update content with summary text if provided
  // Note: summaryText from marked.parse() is already HTML, no need to convert newlines
  if (summaryText) {
    content.innerHTML = summaryText;
  }
}

/**
 * Handle summarize button click event
 * 处理总结按钮点击事件
 * 
 * @param {HTMLElement} target - The clicked button element
 */
async function summarizeButtonClick(target) {
  var container = target.parentNode;
  
  // Prevent multiple requests while loading
  // 加载时防止多次请求
  if (container.classList.contains('oai-loading')) {
    return;
  }

  // Set loading state
  // 设置加载状态
  const loadingText = container.querySelector('.oai-summary-btn').dataset.loadingText;
  setOaiState(container, 1, loadingText, null);

  // Get the request URL and prepare data
  // 获取请求URL并准备数据
  var url = target.dataset.request;
  var data = {
    ajax: true,
    _csrf: context.csrf
  };

  try {
    // Send request to PHP backend
    // 向PHP后端发送请求
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const xresp = response.data;
    console.log(xresp);

    // Check if response is valid
    // 检查响应是否有效
    if (response.status !== 200 || !xresp.response || !xresp.response.data) {
      const requestFailedText = container.querySelector('.oai-summary-btn').dataset.requestFailedText;
      throw new Error(requestFailedText);
    }

    // Handle error response
    // 处理错误响应
    if (xresp.response.error) {
      setOaiState(container, 2, xresp.response.data, null);
    } else {
      // Parse parameters returned by PHP
      // 解析PHP返回的参数
      const oaiParams = xresp.response.data;
      const oaiProvider = xresp.response.provider;
      
      // Send request to appropriate AI provider
      // 向合适的AI提供商发送请求
      if (oaiProvider === 'openai') {
        await sendOpenAIRequest(container, oaiParams);
      } else if (oaiProvider === 'gemini') {
        await sendGeminiRequest(container, oaiParams);
      } else {
        await sendOllamaRequest(container, oaiParams);
      }
    }
  } catch (error) {
    console.error(error);
    // Show more specific error message
    // 显示更具体的错误信息
    const errorMsg = error.response?.data?.error?.message || 
                    error.message || 
                    'Request Failed';
    setOaiState(container, 2, errorMsg, null);
  }
}

/**
 * Send summarization request to OpenAI API
 * 向OpenAI API发送总结请求
 * 
 * @param {HTMLElement} container - The summary container element
 * @param {Object} oaiParams - OpenAI API parameters
 */
async function sendOpenAIRequest(container, oaiParams) {
  try {
    // Prepare request body by removing URL and key
    // 准备请求体，移除URL和密钥
    let body = JSON.parse(JSON.stringify(oaiParams));
    delete body['oai_url'];
    delete body['oai_key'];
    body["stream"] = true; // Ensure stream is true for OpenAI API
    
    // Send POST request to OpenAI API
    // 向OpenAI API发送POST请求
    const response = await fetch(oaiParams.oai_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oaiParams.oai_key}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Request Failed');
    }

    // Process streaming response with buffer
    // 使用缓冲区处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let text = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Complete the summary process
        // 完成总结过程
        setOaiState(container, 0, 'finish', null);
        break;
      }
      
      // Append new data to buffer
      // 将新数据添加到缓冲区
      buffer += decoder.decode(value, { stream: true });
      
      // Process each line in buffer
      // 处理缓冲区中的每一行
      let endIndex;
      while ((endIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, endIndex).trim();
        buffer = buffer.slice(endIndex + 1);
        
        // Skip empty lines
        // 跳过空行
        if (!line) continue;
        
        // Check for done signal
        // 检查是否完成
        if (line === 'data: [DONE]') {
          break;
        }
        
        // Extract JSON data from line (remove "data: " prefix)
        // 从行中提取JSON数据（移除"data: "前缀）
        if (line.startsWith('data: ')) {
          const jsonString = line.slice(6).trim();
          try {
            const json = JSON.parse(jsonString);
            if (json.choices && json.choices[0].delta) {
              const delta = json.choices[0].delta;
              if (delta.content) {
                text += delta.content;
                // Update the summary content
                // 更新总结内容
                setOaiState(container, 0, null, marked.parse(text));
              }
            }
          } catch (e) {
            // If JSON parsing fails, output the error
            // 如果JSON解析失败，输出错误
            console.error('Error parsing OpenAI response:', e, 'Line:', jsonString);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    // Show more specific error message
    // 显示更具体的错误信息
    const errorMsg = error.response?.data?.error?.message || 
                    error.message || 
                    'Request Failed';
    setOaiState(container, 2, errorMsg, null);
  }
}


/**
 * Send summarization request to Ollama API
 * 向Ollama API发送总结请求
 * 
 * @param {HTMLElement} container - The summary container element
 * @param {Object} oaiParams - Ollama API parameters
 */
async function sendOllamaRequest(container, oaiParams){
  try {
    // Send POST request to Ollama API
    // 向Ollama API发送POST请求
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if API key exists
    // 只有当API key存在时才添加Authorization头
    if (oaiParams.oai_key && oaiParams.oai_key.trim() !== '') {
      headers['Authorization'] = `Bearer ${oaiParams.oai_key}`;
    }
    
    const response = await fetch(oaiParams.oai_url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(oaiParams)
    });

    if (!response.ok) {
      throw new Error('Request Failed');
    }

    // Process streaming response with buffer
    // 使用缓冲区处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let text = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Complete the summary process
        // 完成总结过程
        setOaiState(container, 0, 'finish', null);
        break;
      }
      
      // Append new data to buffer
      // 将新数据添加到缓冲区
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete JSON objects from the buffer
      // 从缓冲区处理完整的JSON对象
      let endIndex;
      while ((endIndex = buffer.indexOf('\n')) !== -1) {
        const jsonString = buffer.slice(0, endIndex).trim();
        try {
          if (jsonString) {
            const json = JSON.parse(jsonString);
            text += json.response;
            
            // Update the summary content
            // 更新总结内容
            setOaiState(container, 0, null, marked.parse(text));
          }
        } catch (e) {
          // If JSON parsing fails, output the error and keep the chunk for future attempts
          // 如果JSON解析失败，输出错误并保留该块用于后续尝试
          console.error('Error parsing JSON:', e, 'Chunk:', jsonString);
        }
        
        // Remove the processed part from the buffer
        // 从缓冲区移除已处理的部分
        buffer = buffer.slice(endIndex + 1); // +1 to remove the newline character
      }
    }
  } catch (error) {
    console.error(error);
    // Show more specific error message
    // 显示更具体的错误信息
    const errorMsg = error.response?.data?.error?.message || 
                    error.message || 
                    'Request Failed';
    setOaiState(container, 2, errorMsg, null);
  }
}

/**
 * Send summarization request to Gemini API
 * 向Gemini API发送总结请求
 * 
 * @param {HTMLElement} container - The summary container element
 * @param {Object} oaiParams - Gemini API parameters
 */
async function sendGeminiRequest(container, oaiParams) {
  try {
    const url = `${oaiParams.oai_url}?key=${oaiParams.oai_key}&alt=sse`;
    const body = {
      systemInstruction: { parts: [{ text: oaiParams.systemInstruction }] },
      contents: [{ parts: [{ text: oaiParams.prompt }] }]
    };

    // Send POST request to Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || 'Request Failed';
      throw new Error(errorMsg);
    }

    // Process streaming response with buffer
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let text = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        setOaiState(container, 0, 'finish', null);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let endIndex;
      while ((endIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, endIndex).trim();
        buffer = buffer.slice(endIndex + 1);

        if (!line) continue;

        if (line.startsWith('data: ')) {
          const jsonString = line.slice(6).trim();
          if (jsonString) {
            try {
              const json = JSON.parse(jsonString);
              if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) {
                const chunkText = json.candidates[0].content.parts[0].text;
                if (chunkText) {
                  text += chunkText;
                  setOaiState(container, 0, null, marked.parse(text));
                }
              }
            } catch (e) {
              console.error('Error parsing Gemini response:', e, 'Line:', jsonString);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    const errorMsg = error.message || 'Request Failed';
    setOaiState(container, 2, errorMsg, null);
  }
}
