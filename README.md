# AI-Powered Car Ad Reviewer with Image Classification

This is a Node.js Express web application for submitting car ads, which combines image classification to detect vehicle images and AI-powered text review using LangChain and Groq's Llama-3.1-8B-Instant model to automatically review ad descriptions for appropriateness (e.g., offensive language, misleading claims, mismatches). Ads are approved only if images are classified as vehicles and description is appropriate; otherwise, rejected. Ads are saved to `data.json` with review status ("approve" or "reject") and reason.


## Features
- Web form for entering car details (brand, model, variant, year, mileage, fuel type, engine type, transmission, condition, description).
- Image classification using an ONNX model to verify uploaded images are of vehicles.
- AI review using Groq's Llama-3.1-8B-Instant model to detect inappropriate content.
- Saves all ads to `data.json` with review status and reason.
- Supports multilingual ads (English, Urdu, Roman Urdu).
- Error handling for API connection issues and model failures.

## Image Classification
The application uses a pre-trained ONNX (Open Neural Network Exchange) model for image classification, trained to distinguish between "vehicle" and "non-vehicle" images. This ensures that only ads with valid vehicle photos are processed further.

### System Requirements and Resources
To run the ONNX model for image classification, the following resources are recommended:

- **CPU**: Multi-core processor (at least 4 cores) for efficient inference. Modern CPUs (e.g., Intel i5 or equivalent) can process images in 100-500ms per image. GPU acceleration is not supported in this Node.js setup, so CPU-only.
- **RAM**: 8GB recommended. The model loads into memory (~100-200MB for the ONNX runtime session), plus additional space for image processing.
- **Disk Space**: ~200MB for the model file (`best.onnx`), plus space for uploaded images and results.
- **Processing Power**: Low to moderate. The model is lightweight (YOLOv8 classification variant), optimized for real-time inference. Batch processing multiple images sequentially is supported but not parallelized in this implementation.
- **Dependencies**: Requires `onnxruntime-node` (installed via npm), which is optimized for performance on x86/ARM architectures.

Note: The model was trained using YOLOv8 (results in `runs/classify/train/` include confusion matrices, training batches, and metrics). For production scaling, consider offloading to a GPU-enabled service if high throughput is needed.

### How It Works
1. **Model Loading**: On startup, the app loads the ONNX model from `runs/classify/train/weights/best.onnx` using the `onnxruntime-node` library.
2. **Image Preprocessing**: Uploaded images are resized to 224x224 pixels using Sharp, converted to RGB, and normalized (pixel values divided by 255.0). The channels are transposed from HWC (Height, Width, Channels) to CHW (Channels, Height, Width) format as required by the model.
3. **Inference**: The preprocessed image tensor is fed into the ONNX session for prediction. The model outputs probabilities for "non-vehicle" and "vehicle" classes.
4. **Decision**: If any image is classified as "non-vehicle", the ad is rejected immediately. Only ads with all images as "vehicle" proceed to AI review.
5. **Performance**: Classification is fast and runs locally, avoiding external API calls for images.

### Build Our Own Model
To customize or retrain the classification model:
1. **Tools**: Use open-source libraries like Ultralytics YOLOv8 (Python-based) for training. Install via `pip install ultralytics`.
2. **Dataset**: Prepare a dataset of vehicle and non-vehicle images (e.g., from Kaggle or custom collection). Label them accordingly.
3. **Training**: Run YOLOv8 classification training with commands like `yolo classify train data=path/to/data.yaml model=yolov8n-cls.pt epochs=100`. Export to ONNX: `yolo export model=path/to/best.pt format=onnx`.
4. **Local API**: For a standalone API, use FastAPI or Flask in Python to serve the ONNX model. Example: Load model with `onnxruntime` and expose endpoints for image classification. This allows the Node.js app to call a local API instead of embedding the model.
5. **Benefits**: Fully open-source, customizable, no external dependencies. Host locally for privacy/security.

### How This Code Works and Connects with Web
- **Backend (Node.js/Express)**: The app runs as a server on port 3000. It serves static files (HTML, CSS, JS) and handles form submissions via POST to `/submit`. Image classification happens locally using ONNX, and AI review calls Groq's API. Results are saved to JSON and responses sent back as JSON.
- **Frontend Integration**: The web form (`templates/index.html`) submits data via JavaScript (`static/script.js`) using Fetch API to the backend. No full-stack framework; simple AJAX for communication. Can be integrated into any web app by calling the `/submit` endpoint with form data.

## AI Review Agent
The AI review agent leverages LangChain.js to chain a prompt template with Groq's Llama-3.1-8B-Instant large language model (LLM) for content moderation. It enforces strict rules to ensure ad descriptions are appropriate, truthful, and relevant.

### How the Agent Works
1. **Setup**: The agent is initialized in `reviewAgent.js` using LangChain's `ChatGroq` class, configured with the Groq API key from `.env`. It uses a `PromptTemplate` to structure inputs and a `JsonOutputParser` to ensure structured JSON responses.
2. **Prompt Engineering**: The prompt is a detailed template that includes:
   - Ad details (brand, model, etc.) as variables.
   - Multilingual support for English, Urdu script, and Roman Urdu.
   - Specific rules for rejection (e.g., inappropriate language, mismatches, spammy content).
   - Allowances for common car-related terms (e.g., "minor touch", "duplicate file").
   - Instructions to respond only in JSON format with "decision" ("Approve" or "Reject") and "reason".
3. **Processing**: When an ad passes image classification, the agent receives the ad data, formats it into the prompt, and invokes the LLM via Groq's API.
4. **Decision Making**: The LLM analyzes the description against the rules:
   - Rejects for offensive/abusive language in any language.
   - Allows subjective claims (e.g., "like new") but rejects verifiable mismatches (e.g., brand mismatch).
   - Flags irrelevant or suspicious content.
   - Special handling for "duplicate" mentions (allowed unless combined with "original").
5. **Output**: Returns a JSON object with approval/rejection and a clear reason. If the LLM fails (e.g., API error), the app handles it gracefully with user-friendly messages.
6. **Integration**: The agent's `getAdReviewChain()` function returns a runnable chain (prompt → LLM → parser) that integrates seamlessly into the Express route handler.

This agent ensures consistent, rule-based moderation without manual intervention, supporting high-volume ad submissions.

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
