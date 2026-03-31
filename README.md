📸 RenderFlow × 🎨 DesignMind PRO

Team Members: Xin Yang 楊欣 (MC569046) × Zelda Zhang 張晉華 (MC569133)

YouTube Intro: https://youtu.be/X1ac-t89RTg

Welcome to your one-stop visual creation workstation!

This project ingeniously combines two powerful tools into a single web application. Think of it as your "Exclusive Photo Studio" and "AI Graphic Design Department". From capturing a great photo and processing images, to having AI write your copy and handle the layout—you can do it all seamlessly right here!

A one-click toggle button in the top-left corner allows you to smoothly switch between the two tools.

📸 1. RenderFlow: Your Exclusive Image Studio

RenderFlow is a dark-themed, minimalist image processing tool. Whether you open the camera for an instant shot or upload a photo from your album, it helps you prepare the foundational "visual assets."

✨ Key Features:

📐 Master-Level Camera Guides:
Don't know how to frame a good shot? The camera has 6 built-in professional composition grids (including rule of thirds, diagonals, symmetry, framing, etc.). It not only draws the lines for you, but also pops up easy-to-understand "shooting tips" at the bottom, teaching you exactly how to position your subject!

🪄 Magic Studio Effects:

🤖 AI Hand-Drawn Line Art: Connects to Google Gemini AI to instantly turn your photos into artistic black-and-white sketches, with the freedom to adjust line weight and detail levels!

⚡ Real-Time Frontend Filters: Don't want to wait for cloud computing? Leveraging the browser's powerful Canvas 2D performance, instantly apply High-Contrast Thermal, Pixel Mosaic, Vintage Halftone, or super cool ASCII character poster effects.

💾 Time-Machine History:
Every step of your color grading is automatically saved in your browser (intelligently compressed into tiny thumbnails). You can go back to modify, download, or individually delete unwanted records at any time.

🌐 Bilingual Toggle: One-click switch between Traditional Chinese and English interfaces in the top right corner.

🎨 2. DesignMind PRO: Your AI Graphic Designer

Got the right assets? Hand them over to DesignMind PRO! This is a light-themed layout artifact that produces master-level posters in just three simple steps.

✨ Key Features:

✍️ Zero Inspiration Needed (AI Copywriting):
Give the AI a single sentence, and it will expand it into 3 highly polished advertising slogans. You can even just drop in the image you just processed, and the AI will literally "read the picture and tell a story," brainstorming the perfect copy for you!

🎭 Cure for Indecision (AI Style Recommendation):
Built-in with 8 world-class design schools, including Minimalist, Magazine, Cyberpunk, Retro Film, and more. Don't know which one to choose? Click "✨ AI Suggest" and let the AI decide based on your image's color tone.

📐 One-Click 4-Layout Generation:
Supports multiple aspect ratios (Original, 1:1, 4:5, 9:16) and "Full Bleed" or "Geometric Inset" modes. One click gives you four completely different, stunning poster layouts.

🛡️ Exclusive Black Tech: Foolproof Layout System (V3 Upgrade)

We've solved the most common "broken layout" and "illegible text" issues in AI-generated designs:

Always Legible (Smart Contrast Shield): The system automatically calculates the contrast ratio between the font and background colors. If the text is about to blend into the background, the system forces it to "pure black" or "pure white," or automatically adds a glow/shadow, guaranteeing text is always crystal clear!

Never Bleeds Off Canvas (Smart Boundaries & Anchoring): If text gets too close to the edge, it automatically changes its growth direction (e.g., text near the bottom will grow upwards). Circular crops are also guaranteed to be 100% perfect circles, never distorting into weird polygons.

Smart Line Breaks: Completely disables the browser's arbitrary line wrapping, strictly adhering to the AI's natural line breaks based on semantics and punctuation.

🛠️ How to Get Started?

This is a pure frontend project developed with React 19 + Vite 8 + Tailwind CSS 3.

1. Install and Run

npm install
npm run dev


Open your browser and navigate to http://localhost:5173/ to see the main app!

2. Configure AI Keys (API Key)

To let the AI unleash its full power (brainstorming copy, laying out designs, drawing line art), please configure your keys in both tools:

In DesignMind PRO (Layout Tool):
Click the "⚙️ Gear" icon in the top right corner and enter your API Base URL, API Key, and Model (highly recommended to use advanced models like gemini-2.5-pro-cli or gpt-4o).

In RenderFlow (Imaging Tool):
When you select the "AI Hand-Drawn Line Art" mode, you can input your Gemini API Key in the left control panel.

Once set, they are automatically saved locally on your computer, so you don't need to re-enter them next time!

🚀 Export & Deployment

One-Click Download: Whether it's the effect images from RenderFlow or the posters from DesignMind PRO (supporting 1x/2x/3x HD quality), you can download lossless PNG/JPGs with a single click once you're satisfied with the preview.

**Repository:** [github.com/wendy9095/Zelda](https://github.com/wendy9095/Zelda)

Static Deployment: This project supports static hosting (e.g. GitHub Pages). After `npm run build`, upload or serve the `dist/` folder.  
*Note:* Pushing GitHub Actions workflow files from the command line requires a Personal Access Token with the **workflow** scope. If your push was blocked for that reason, add a Pages workflow later via the GitHub website or enable the right token scope.

⚠️ Quick Reminder: To protect your wallet, please do not hardcode your real API Keys directly into the public codebase and upload them to GitHub! Saving keys in the browser's LocalStorage is the safest practice.