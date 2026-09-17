
🧠 Student Mental Health Predictor

A full-stack machine learning web application that uses student lifestyle,
social media usage, academic habits, sleep, physical activity, stress levels,
and demographic information to generate a model-based mental health score.

The project takes a trained machine learning model beyond a notebook and turns it into an interactive, 
user-friendly application with a FastAPI backend and deployed REST API.

🚀 Key Features
🤖 Machine Learning Prediction — Generates a mental health score from multiple student-related factors.
📝 Interactive Prediction Form — Collects and validates student information through a structured interface.
⚡ FastAPI Backend — Provides a dedicated /predict REST API endpoint for real-time predictions.
🛡️ Pydantic Validation — Validates incoming API data and enforces expected field types and values.
📊 Scikit-learn Model — Uses a trained regression model to generate predictions.
🔄 Frontend–Backend Integration — Connects the JavaScript frontend with the Python ML API using HTTP requests.
📈 Visual Prediction Result — Displays the predicted score with an animated score meter and interpretation.
🌙 Dark / Light Mode — Includes a theme switcher for a better user experience.
📱 Responsive UI — Designed to work across desktop, tablet, and mobile screens.
🟢 API Health Monitoring — Shows the current API connection status.
⚠️ Error Handling — Handles invalid inputs, API failures, and network errors gracefully.
✨ Interactive UI & Animations — Includes smooth scrolling, reveal animations, loading states, and interactive controls.
🛠️ Tech Stack
Frontend
HTML5
CSS3
JavaScript
Backend
Python
FastAPI
Pydantic
Uvicorn
Machine Learning & Data Processing
Pandas
Scikit-learn
Joblib
Deployment
Render
🔄 How It Works
User Input
    ↓
Frontend Validation
    ↓
JSON Request
    ↓
FastAPI /predict
    ↓
Pydantic Validation
    ↓
Data Preprocessing
    ↓
Trained ML Model
    ↓
Predicted Score
    ↓
Visual Result
The user enters student information such as social media usage, study hours, sleep, physical activity, stress level, and academic details.
JavaScript validates and collects the form data.
The data is sent as JSON to the FastAPI /predict endpoint.
Pydantic validates the incoming request.
The backend prepares the input for the trained machine learning model.
The Joblib-loaded model generates the predicted score.
FastAPI returns the prediction as a JSON response.
The frontend displays the result with an animated visual score.

The backend currently loads the trained model with Joblib and returns the predicted score from the /predict endpoint.

📌 Project Highlights

This project demonstrates the complete journey from machine learning model → API → frontend → deployed application.

Rather than keeping the model isolated, I integrated it into a usable web interface where users can interact with the model and receive predictions in real time.

⚠️ Disclaimer

This project is developed for educational and project purposes only. The generated score is a machine learning prediction and is not a medical diagnosis or professional mental-health assessment.
