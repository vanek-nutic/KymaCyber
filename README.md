# 🚀 Kimi Cyber

**AI Extended Thinking with Multi-Tool Orchestration**

A full-featured AI assistant application powered by Moonshot AI's Kimi K2 model, featuring extended thinking capabilities, multi-tool orchestration, file upload/analysis, chat history, and a stunning cyber-themed UI.

![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.2-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🧠 AI Capabilities
- **Extended Thinking Process** - Visualize AI's reasoning steps in real-time
- **Multi-Tool Orchestration** - Seamlessly use multiple tools in a single query
- **Streaming Responses** - Real-time updates as the AI generates responses
- **Smart Tool Selection** - AI automatically selects the best tools for your query

### 🔧 Available Tools
1. **web_search** - Search the web for current information
2. **code_runner** - Execute Python code for calculations and data processing
3. **quickjs** - Run JavaScript code for quick computations
4. **convert** - Convert units (temperature, length, weight, etc.)
5. **calculate** - Perform mathematical calculations
6. **get_current_time** - Get current date and time
7. **get_weather** - Fetch weather information
8. **get_stock_price** - Retrieve stock prices
9. **get_exchange_rate** - Get currency exchange rates
10. **get_news** - Fetch latest news articles
11. **get_translation** - Translate text between languages

### 📁 File Management
- **File Upload** - Upload CSV, Excel, TXT, or JSON files
- **Data Analysis** - AI-powered analysis of uploaded data
- **File Persistence** - Files stored in localStorage
- **File Management** - View, delete, and manage uploaded files

### 💬 Chat History
- **Auto-Save** - Conversations automatically saved to localStorage
- **Search** - Find past conversations quickly
- **Export** - Download history as JSON
- **Load Query** - Reload previous queries with one click
- **Delete** - Remove individual entries or clear all history

### 🎨 UI Enhancements
- **Markdown Rendering** - Beautiful formatting with GFM support
- **Syntax Highlighting** - Code blocks with language detection
- **Copy Buttons** - One-click copy for results and code
- **Keyboard Shortcuts** - Power user features for efficiency
- **Toast Notifications** - Visual feedback for all actions
- **Cyber Theme** - Stunning neon-accented dark theme

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Moonshot AI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kimi-cyber.git
cd kimi-cyber
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Moonshot AI API key:
```env
VITE_MOONSHOT_API_KEY=your_api_key_here
```

4. **Start the development server**
```bash
pnpm run dev
# or
npm run dev
```

5. **Open your browser**
```
http://localhost:5175
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Enter` | Submit Query | Submit the current query |
| `Ctrl+K` | Clear All | Clear all fields and reset state |
| `Esc` | Close Modal | Close any open modal (history, files) |

---

## 📖 Usage Guide

### Basic Query
1. Enter your question in the textarea
2. Press `Ctrl+Enter` or click "🚀 Submit Query"
3. Watch the AI think and use tools in real-time
4. View the formatted results with markdown and syntax highlighting

### Multi-Tool Query Example
```
Search for the latest news about AI breakthroughs in 2025, 
then calculate the square root of 144, and convert 75 
fahrenheit to celsius. Format the response with proper 
markdown including headings, lists, and code examples.
```

This query will:
- Use `web_search` to find AI news
- Use `quickjs` to calculate square root
- Use `convert` to convert temperature
- Format everything beautifully with markdown

### File Upload & Analysis
1. Click "📤 Upload File"
2. Select a CSV, Excel, TXT, or JSON file
3. File appears in "📁 My Files"
4. Ask questions about your data:
   ```
   Analyze the uploaded sales data and show me the top 5 products
   ```

### Chat History
1. Click "📜 History" to view past conversations
2. Use the search bar to find specific queries
3. Click "🔄" to reload a previous query
4. Click "📥 Export" to download history as JSON
5. Click "🗑️" to delete individual entries or clear all

---

## 🎨 Theme & Styling

Kimi Cyber features a stunning **cyber-themed** design with:
- **Neon green accents** (#00ff88)
- **Dark navy background** for reduced eye strain
- **Purple/blue gradients** for visual interest
- **Smooth animations** and transitions
- **Responsive design** for all screen sizes

---

## 🏗️ Project Structure

```
kimi-cyber/
├── src/
│   ├── components/
│   │   ├── ChatHistory.tsx       # Chat history modal
│   │   ├── ChatHistory.css       # Chat history styles
│   │   ├── FileUpload.tsx        # File upload component
│   │   ├── FileUpload.css        # File upload styles
│   │   ├── MarkdownRenderer.tsx  # Markdown rendering
│   │   └── MarkdownRenderer.css  # Markdown styles
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts hook
│   ├── App.tsx                   # Main application component
│   ├── App.css                   # Main application styles
│   ├── index.css                 # Global styles & theme
│   └── main.tsx                  # Application entry point
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite configuration
└── README.md                     # This file
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_MOONSHOT_API_KEY` | Your Moonshot AI API key | Yes |

### Vite Configuration

The app uses Vite for fast development and optimized builds. Key configurations:
- **Port:** 5175 (configurable in `vite.config.ts`)
- **Host:** 0.0.0.0 (accessible from network)
- **Allowed Hosts:** Configured for proxied domains

---

## 📦 Build & Deploy

### Production Build
```bash
pnpm run build
# or
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build
```bash
pnpm run preview
# or
npm run preview
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

---

## 🧪 Testing

### Manual Testing
1. Run the development server
2. Test all features systematically
3. Check console for errors
4. Verify responsive design

### Test Coverage
- ✅ Core functionality
- ✅ Multi-tool orchestration
- ✅ File upload & analysis
- ✅ Chat history
- ✅ UI enhancements
- ✅ Keyboard shortcuts
- ✅ Error handling

See `FINAL_TEST_REPORT.md` for detailed test results.

---

## 📚 Documentation

- **Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **Phase Summaries:** `PHASE_*_SUMMARY.md`
- **Testing Plan:** `FINAL_TESTING_PLAN.md`
- **Test Report:** `FINAL_TEST_REPORT.md`
- **Changelog:** `CHANGELOG.md`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### Common Issues

**Q: API key not working**
- Ensure your API key is correctly set in `.env`
- Restart the development server after changing `.env`
- Check that the key has proper permissions

**Q: File upload not working**
- Check browser localStorage is enabled
- Ensure file size is under 10MB
- Verify file type is supported (CSV, Excel, TXT, JSON)

**Q: Streaming not updating**
- Check network connection
- Verify API endpoint is accessible
- Try toggling streaming off and on

**Q: History not saving**
- Check browser localStorage is enabled
- Clear localStorage and try again
- Verify no browser extensions are blocking storage

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Moonshot AI** for the powerful Kimi K2 model
- **React** team for the amazing framework
- **Vite** team for the blazing-fast build tool
- **highlight.js** for syntax highlighting
- **react-markdown** for markdown rendering
- **react-hot-toast** for beautiful notifications

---

## 📞 Contact

For questions, issues, or feedback:
- **GitHub Issues:** [Create an issue](https://github.com/yourusername/kimi-cyber/issues)
- **Email:** your.email@example.com
- **Twitter:** @yourusername

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ using React, TypeScript, and Moonshot AI**

