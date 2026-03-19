<?php
return array(
    'config' => array(
        'ai_provider' => 'Choose AI Provider',
        'base_url' => 'Base URL (http(s)://oai.com/) without \'v1\'',
        'api_key' => 'API Key',
        'model_name' => 'Model Name',
        'prompt' => 'Prompt (add before content)',
        'default_prompt' => 'Please summarize the following article in English. Keep it concise but informative, highlighting the key points and main ideas.',
        'save' => 'Save',
        'openai' => 'OpenAI',
        'ollama' => 'Ollama',
        'gemini' => 'Gemini'
    ),
    'button' => array(
        'summarize' => 'Summarize'
    ),
    'status' => array(
        'loading' => 'Loading...',
        'error' => 'Error',
        'request_failed' => 'Request Failed'
    )
);
