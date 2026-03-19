<?php
return array(
    'config' => array(
        'ai_provider' => '选择AI提供商',
        'base_url' => '基础URL (http(s)://oai.com/) 不需要\'v1\'',
        'api_key' => 'API密钥',
        'model_name' => '模型名称',
        'prompt' => '提示词 (添加到内容前)',
        'default_prompt' => '请用中文总结以下文章。保持简洁但信息丰富，突出关键点和主要思想。',
        'save' => '保存',
        'openai' => 'OpenAI',
        'ollama' => 'Ollama',
        'gemini' => 'Gemini'
    ),
    'button' => array(
        'summarize' => '总结'
    ),
    'status' => array(
        'loading' => '加载中...',
        'error' => '错误',
        'request_failed' => '请求失败'
    )
);
