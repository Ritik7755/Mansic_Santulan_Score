import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field
import pandas as pd
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
model = joblib.load('Social_media_n_Mental_Health_Model.pkl')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class PredictionResponse(BaseModel):
    predicted_mental_health_score: float


# Base model
class MentalHealth(BaseModel):

    Age: int = Field(..., gt=10, le=100)

    Gender: Literal['Male', 'Female']

    Country: str

    Academic_Level: Literal['Undergraduate', 'Graduate', 'High School']

    Most_Used_Platform: Literal[
        'Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
        'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte',
        'WhatsApp', 'WeChat'
    ]

    Purpose_Of_Use: Literal[
        'Networking', 'Education', 'Entertainment', 'News'
    ]

    Avg_Daily_Usage_Hours: float = Field(..., gt=1, le=24)

    Daily_Unlocks: int = Field(..., gt=0)

    Study_Hours: float = Field(...,  le=24)

    Physical_Activity_Hours: float = Field(..., gt=0)

    Sleep_Hours_Per_Night: float = Field(..., gt=0, le=24)

    Stress_Level: Literal[
        'Medium', 'Low', 'Very High', 'High'
    ]


top_countries = [
    'Other', 'India', 'USA', 'Canada', 'Australia',
    'UK', 'Germany', 'Mexico', 'Turkey', 'France'
]


@app.post('/predict')
def predict(data: MentalHealth):

    country_group = (
        data.Country
        if data.Country in top_countries
        else "Other"
    )

    input_predict = pd.DataFrame([{

        'Age': data.Age,

        'Gender': data.Gender,

        'Country': data.Country,

        'Academic_Level': data.Academic_Level,

        'Most_Used_Platform': data.Most_Used_Platform,

        'Purpose_Of_Use': data.Purpose_Of_Use,

        'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,

        'Daily_Unlocks': data.Daily_Unlocks,

        'Study_Hours': data.Study_Hours,

        'Physical_Activity_Hours': data.Physical_Activity_Hours,

        'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,

        'Stress_Level': data.Stress_Level,

        'Grouped_country': country_group

    }])

    prediction = model.predict(input_predict)[0]

    return PredictionResponse(
        predicted_mental_health_score=round(float(prediction), 2)
    )