# AI-Powered Car Ad Reviewer with Image Classification

This is a Node.js Express web application for submitting car ads, which combines image classification to detect vehicle images and AI-powered text review using LangChain.js and Groq's Llama-3.1-8B-Instant model to automatically review ad descriptions for appropriateness (e.g., offensive language, misleading claims, mismatches). Ads are approved only if images are classified as vehicles and description is appropriate; otherwise, rejected. Ads are saved to `data.json` with review status ("approve" or "reject") and reason.

## Features
- Web form for entering car details (brand, model, variant, year, mileage, fuel type, engine type, transmission, condition, description).
- AI review using Groq's Llama-3.1-8B-Instant model to detect inappropriate content.
- Saves all ads to `data.json` with review status and reason.
- Supports multilingual ads (English, Urdu, Roman Urdu).
- Error handling for API connection issues.

## Prerequisites
- Node.js 16+.
- Groq API key (free tier available).
- VS Code or any code editor.

## Setup Instructions

### 1. Install Dependencies
Clone or download the project, then install Node.js dependencies:

```bash
npm install
```

This installs Express, LangChain.js, Groq integrations, and dotenv.

### 2. Get Groq API Key
- Sign up at [groq.com](https://groq.com) for a free API key.
- Create a `.env` file in the project root and add:
  ```
  GROQ_API_KEY=your_api_key_here
  ```

### 3. Run the Application
Navigate to the project directory and run:

```bash
npm start
```

The Express server will start on `http://localhost:3000`.

### 4. Access the App
- Open your browser and go to `http://localhost:3000`.
- Fill out the car ad form.
- Submit the form. The AI will review it and show approval/rejection.
- Check `data.json` for saved ads with status.

## Usage
1. **Submit an Ad**:
   - Enter car details in the form.
   - Include a description (can be in English, Urdu, or Roman Urdu).
   - Click "Save".

2. **AI Review**:
   - The app reviews for:
     - Offensive/abusive language.
     - Misleading claims (e.g., "like new" is allowed for "Used" condition).
     - Mismatches between description and details.
     - Spammy/non-car content.
   - If rejected, you'll see the reason; if approved, a success message.

3. **View Saved Data**:
   - Open `data.json` to see all submissions with fields like `status` ("approve"/"reject") and `review_reason`.

## Troubleshooting
- **API Connection Error**: Check your Groq API key in `.env` and internet connection.
- **JSON Parsing Error**: The model should respond with valid JSON; if not, check the prompt.
- **Static Files 404**: Ensure `static/` directory exists with `style.css` and `script.js`.
- **No Data Saved**: Check console for errors; verify write permissions in the project directory.

## Project Structure
- `app.js`: Main Express app with routes and data saving.
- `reviewAgent.js`: LangChain.js setup for AI review using Groq.
- `templates/index.html`: Web form.
- `static/script.js`: Frontend form handling.
- `static/style.css`: Basic styling.
- `data.json`: Saved ads (auto-created).
- `package.json`: Dependencies.
- `.env`: API key (not committed).


For issues, check the Node.js console output.
