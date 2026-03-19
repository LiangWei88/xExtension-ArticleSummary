# FreshRSS Article Summary Extension

- [中文 README](README_zh.md)

This extension for FreshRSS allows users to generate summaries of articles using a language model API that conforms to the OpenAI API specification. The extension provides a user-friendly interface to configure the API endpoint, API key, model name, and a prompt to be added before the content. When activated, it adds a "summarize" button to each article, which, when clicked, sends the article content to the configured API for summarization.

## Features

- **Multiple API Providers**: Supports OpenAI, Ollama, and Gemini API providers for maximum flexibility.
- **API Configuration**: Easily configure the base URL, API key, model name, and prompt through a simple form.
- **Summarize Button**: Adds a "summarize" button to each article, allowing users to generate a summary with a single click.
- **Markdown Support**: Converts HTML content to Markdown before sending it to the API, ensuring compatibility with various language models.
- **Streaming Response**: Processes and displays summarization results in real-time as they are received from the API.
- **Automatic API Version Handling**: Automatically adds the appropriate API version path (e.g., `/v1` for OpenAI or `/v1beta` for Gemini) to the base URL if missing.
- **Enhanced Error Handling**: Provides detailed error messages in case of API errors or incomplete configurations.
- **Content Security Policy**: Configured to allow API requests to external endpoints.
- **Internationalization (i18n)**: Supports English, Simplified Chinese (zh-CN), and Traditional Chinese (zh-TW) languages.
- **Default Prompt and Placeholder**: Provides language-specific default prompts and input placeholders if no custom prompt is set.

## Installation

1. **Download the Extension**: Clone or download this repository to your FreshRSS extensions directory.
2. **Enable the Extension**: Go to the FreshRSS extensions management page and enable the "ArticleSummary" extension.
3. **Configure the Extension**: Navigate to the extension's configuration page to set up your API details.

## Configuration

To configure the extension, follow these steps:

1. **Base URL**: Enter the base URL of your language model API (e.g., `https://api.openai.com/`). Note that the URL should not include the version path (e.g., `/v1`).
2. **API Key**: Provide your API key for authentication.
3. **Model Name**: Specify the model name you wish to use for summarization (e.g., `gpt-3.5-turbo`).
4. **Prompt**: Add a prompt that will be included before the article content when sending the request to the API.

## Usage

Once configured, the extension will automatically add a "summarize" button to each article. Clicking this button will:

1. Send the article content to the configured API.
2. Display the generated summary below the button.

## Dependencies

- **Axios**: Used for making HTTP requests from the browser.
- **Marked**: Converts Markdown content to HTML for display.

## Development

### Running Tests

This extension includes automated tests to ensure code quality. To run the tests:

```bash
# Install dependencies
composer install

# Run PHPUnit tests
composer test

# Run PHPStan static analysis
composer phpstan

# Run both tests and static analysis
composer ci
```

### Code Quality

The extension follows modern PHP standards and includes:
- **Type declarations**: All methods have proper type hints
- **Final classes**: Classes are marked as `final` to prevent inheritance
- **Static analysis**: PHPStan configuration for detecting potential issues
- **Automated tests**: PHPUnit test suite for core functionality

### Modern PHP Features

The extension has been upgraded to use modern FreshRSS API:
- Uses string-based hooks (`'entry_before_display'`) for backward compatibility with older FreshRSS versions
- Proper type declarations for all methods and parameters
- Uses `ob_start()` for JSON API responses to prevent "headers already sent" errors
- Follows FreshRSS extension development best practices

**Important Note on `ob_start()`**: 
The `ob_start()` call in `summarizeAction()` is **not obsolete** but **essential** for JSON API responses. It prevents the "Cannot modify header information - headers already sent" error by buffering output before headers are set. This is a standard practice for controllers that return JSON responses in FreshRSS extensions.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

When contributing, please ensure:
1. All tests pass: `composer test`
2. Static analysis passes: `composer phpstan`
3. Code follows existing style and conventions
4. New features include appropriate tests

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the FreshRSS community for providing a robust platform for RSS management.
- Inspired by the need for efficient article summarization tools.

## History
- Version: 0.5.2 (2026-01-13)
  > **Bug Fix**: Fixed issue where default prompt was not being restored after deleting old prompt
  > - Added logic to set prompt to null when empty string is submitted
  > - Ensures default prompt is applied when user clears the prompt field

- Version: 0.5.1 (2026-01-13)
  > **Bug Fix**: Fixed issue where prompt settings were not being saved correctly
  > - Changed default prompt logic from `empty()` to `is_null()` check
  > - Ensures empty prompts can be saved and used correctly
  > - Cleaned up debug code and optimized configuration handling

- Version: 0.5.0 (2026-01-08)
  > **Code Quality Improvements**: 
  > - Added type declarations to all methods and parameters
  > - Marked classes as `final` to prevent inheritance
  > - Added PHPStan configuration for static analysis
  > - Added PHPUnit test suite with basic tests
  > - Updated `.gitignore` for better project hygiene
  > - Improved code documentation and comments
  > - **Fixed**: Reverted to string-based hooks for backward compatibility with older FreshRSS versions
  > - **Fixed**: Restored `ob_start()` in `summarizeAction()` - it's essential for JSON API responses to prevent "headers already sent" errors

- Version: 0.4.0 (2026-01-08)
  > **Features Added**: 
  > - Added streaming response support for OpenAI API, consistent with Ollama API

- Version: 0.3.0 (2026-01-08)
  > **Features Added**: 
  > - Implemented internationalization (i18n) support
  > - Added English, Simplified Chinese (zh-CN), and Traditional Chinese (zh-TW) translations
  > - Updated language code structure to follow international standards
  > - All interface elements now support dynamic language switching
  > - Added default prompt and placeholder functionality for language-specific default prompts

- Version: 0.2.0 (2025-01-08)
  > **Features Added**: 
  > - Added support for Ollama API provider
  > - Implemented streaming response processing for real-time summary display
  > - Enhanced error handling with detailed error messages
  > - Added automatic API version handling
  > - Improved content conversion from HTML to Markdown
  > - Updated content security policy configuration

- Version: 0.1.1 (2024-11-20)
  > **Bug Fix**: Prevented the summary button from affecting the title list display. Previously, the 'entry_before_display' hook was causing the summary button to be added to the title list, leading to display issues. Now, the button initially has no text and adds text only when the article is clicked to be displayed.

---

For any questions or support, please open an issue on this repository.