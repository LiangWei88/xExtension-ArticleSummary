<?php
return array(
    'config' => array(
        'ai_provider' => '選擇AI提供商',
        'base_url' => '基礎URL (http(s)://oai.com/) 不需要\'v1\'',
        'api_key' => 'API密鑰',
        'model_name' => '模型名稱',
        'prompt' => '提示詞 (添加到內容前)',
        'default_prompt' => '請用中文繁體總結以下文章。保持簡潔但資訊豐富，突出關鍵點和主要思想。',
        'save' => '儲存',
        'openai' => 'OpenAI',
        'ollama' => 'Ollama',
        'gemini' => 'Gemini'
    ),
    'button' => array(
        'summarize' => '總結'
    ),
    'status' => array(
        'loading' => '載入中...',
        'error' => '錯誤',
        'request_failed' => '請求失敗'
    )
);
