# Customer Churn Prediction — Project Documentation

> Academic & Professional Report (Template with project-specific details)

---

## Cover Page

**Customer Churn Prediction**  
**Project Documentation**  

Prepared by: *[Student Name]*  
Course/Department: *[Course/Department]*  
Guide/Instructor: *[Name]*  
Institution: *[Institution]*  
Academic Year: *[Year]*

---

## Certificate Page

This is to certify that **“Customer Churn Prediction”** is an original work carried out by **[Student Name]** under the supervision of **[Guide Name]** during the academic year **[Year]**.

Signature of Guide: ____________________  
Signature of Head of Department: ____________________  
Date: __ / __ / ____

---

## Acknowledgment

I would like to express my sincere gratitude to **[Guide Name]** for their guidance, support, and constructive feedback throughout the project. I also thank **[Department/Institution]** for providing the resources and learning environment necessary to complete this work. Special thanks to my peers and family for their encouragement.

---

## Abstract (200–300 words)

Customer churn refers to the tendency of customers to discontinue using a service. Predicting churn in advance enables organizations to implement retention strategies, reduce revenue loss, and improve customer satisfaction. This project presents a full-stack machine learning system for customer churn prediction using historical telecom-style customer records and a production-ready architecture. A trained classification model is used to estimate the probability that a customer will churn. The system accepts customer attributes through a web interface, validates inputs using Pydantic models on the backend, and performs churn inference using scikit-learn–based models and preprocessing pipelines. 

The backend is built with FastAPI, providing RESTful APIs for authentication (JWT with bcrypt password hashing), predictions, model status, model information, prediction history, CSV export, and analytics summaries. Predictions are stored per authenticated user in MongoDB using Motor (async driver), ensuring data isolation and traceability. Feature importance is provided as an explainability component to help users understand which factors most strongly influence the predicted outcome.

A modern React frontend offers multi-page dashboards and a prediction workflow with interactive charts, trend visualization, and risk-level indicators. The application also includes advanced analytics modules such as retention simulation, rule-based segmentation, churn forecasting, and interpretability-style explanations.

Overall, the proposed system demonstrates a practical integration of machine learning classification, explainability heuristics, and scalable web deployment practices suitable for academic and real-world evaluation.

---

## Table of Contents

1. Introduction
2. Objectives
3. Literature Review
4. System Analysis
5. System Design
6. Implementation
7. Screenshots Section
8. Testing
9. Results and Discussion
10. Future Scope
11. Conclusion
12. References
13. Appendix

---

## 1. Introduction

### 1.1 Background
Customer churn prediction is a widely studied problem in industries such as telecommunications, subscription services, and banking. When churn occurs, organizations not only lose recurring revenue but also incur additional costs for acquiring new customers. Therefore, predicting churn and identifying its drivers are essential for proactive retention.

Modern machine learning enables churn prediction by learning patterns from historical data, including service usage, billing information, and customer account characteristics. However, beyond accuracy, real systems must also address data validation, secure access, persistence, and explainability.

### 1.2 Problem Statement
The primary problem is to predict whether a customer will churn based on their historical and behavioral attributes. The system must:
- Accept structured customer features through a user interface.
- Produce a churn label and probability.
- Provide meaningful insight (e.g., top contributing features).
- Securely store predictions for user-specific analysis.

### 1.3 Purpose
The purpose of this project is to design and implement a robust churn prediction system that integrates:
- A machine learning classification pipeline,
- A secure REST API with authentication,
- A database-backed prediction history,
- An analytics dashboard with visual explanations.

### 1.4 Scope
The scope includes:
- Model training and artifact management (saved model, scaler, encoders, feature names).
- Real-time prediction via API.
- Persistence of prediction records in MongoDB.
- Dashboards and analytics for history and summaries.
- Advanced modules (simulation, segmentation, forecasting, CLV estimation, and anomaly detection) implemented in backend services.

---

## 2. Objectives

1. Develop a classification-based churn prediction model using scikit-learn.
2. Implement a preprocessing and inference pipeline consistent between training and prediction.
3. Build a secure backend using FastAPI with JWT authentication and bcrypt password hashing.
4. Store predictions per user using MongoDB.
5. Provide interpretable outputs such as feature importance and confidence levels.
6. Create an interactive React frontend with analytics visualizations.
7. Evaluate the system with appropriate testing and document results for academic submission.

---

## 3. Literature Review

### 3.1 Existing Systems
Churn prediction systems commonly leverage:
- Logistic Regression and Support Vector Machines for classification,
- Tree-based models (Decision Trees, Random Forest, Gradient Boosting) for non-linear relationships,
- Feature engineering and encoding for categorical variables,
- Evaluation using accuracy, precision/recall, F1-score, and ROC-AUC.

In deployed settings, many systems provide dashboards, alerts, and segmentation outputs. Some incorporate explainability using SHAP or feature attribution.

### 3.2 Limitations
Common limitations found in existing approaches include:
- Inconsistent preprocessing between training and production inference.
- Lack of explainability beyond raw probabilities.
- Reduced usability due to missing validation, error handling, and secure access.
- Limited traceability of predictions, restricting historical analysis.

### 3.3 Proposed Improvements
This project improves usability and transparency by:
- Enforcing consistent preprocessing using saved artifacts.
- Providing top feature importance contributions and confidence categories.
- Persisting all predictions to enable analytics and trend exploration.
- Delivering a secure multi-page UI with authenticated history and export features.
- Offering additional simulation and segmentation modules for retention-oriented insights.

---

## 4. System Analysis

### 4.1 Existing System
A typical churn prediction workflow in other solutions includes training a model offline and exposing it through a lightweight API. Some systems store minimal inference results and do not offer interactive analytics.

### 4.2 Proposed System
The proposed system is a full-stack web application consisting of:
- **Backend**: FastAPI REST API with ML inference, authentication, persistence, and analytics services.
- **ML Layer**: scikit-learn models with saved preprocessing artifacts.
- **Database**: MongoDB for user accounts and prediction history.
- **Frontend**: React UI with forms, dashboards, charts, and prediction history.

### 4.3 Advantages
- Higher usability due to interactive dashboards and validation.
- Better traceability because all predictions are stored per user.
- Explainability support through feature importance mapping.
- Secure access using JWT and bcrypt.
- Deployment-ready architecture with Docker and environment-based configuration.

---

## 5. System Design

### 5.1 Architecture Diagram (Placeholder)
**Insert Diagram Figure 5.1:** *System Architecture Diagram — Backend/Frontend/Database/ML Pipeline Integration.*

**Diagram Placeholder Location:** Add a diagram that shows:
- React frontend → Axios → FastAPI API routes
- ML inference service → model artifacts → preprocessing
- MongoDB persistence for prediction history

### 5.2 Data Flow Diagram (DFD)

#### 5.2.1 DFD Level 0 (Placeholder)
**Insert Diagram Figure 5.2:** *DFD Level 0 — High-level process flow.*

Components (recommended):
- User
- Frontend UI
- Backend API (Auth, Predict, History, Analytics)
- ML Service
- MongoDB

#### 5.2.2 DFD Level 1 (Placeholder)
**Insert Diagram Figure 5.3:** *DFD Level 1 — Prediction workflow details.*

Recommended subprocesses:
1. Validate JWT token
2. Parse customer input (Pydantic)
3. Preprocess input using saved scaler/encoders
4. Predict probability and label
5. Store prediction record
6. Return response for UI rendering

### 5.3 ER Diagram (If Applicable)
**Insert Diagram Figure 5.4:** *ER Diagram — MongoDB collections and relationships.*

Recommended entities/collections:
- Users
- Predictions

### 5.4 Flowchart (Placeholder)
**Insert Diagram Figure 5.5:** *Flowchart — End-to-end prediction process.*

---

## 6. Implementation

### 6.1 Technologies Used

#### Frontend (if any)
- **React 19** (component-based UI)
- **Vite** (build/dev tooling)
- **React Router** (client-side routing)
- **Axios** (HTTP client)
- **Tailwind CSS v4** (UI styling)
- **Recharts** (charts and visualization)

#### Backend (Python)
- **FastAPI** (REST API framework)
- **Pydantic v2** (data validation and schema)
- **Motor** (async MongoDB driver)
- **MongoDB** (persistent storage)

#### Machine Learning Libraries
- **scikit-learn** (classification models and preprocessing)
- **Pandas** and **NumPy** (data processing)
- **Joblib** (artifact persistence)

#### Database (if used)
- **MongoDB 7** (collections for users and predictions)

### 6.2 Module Description

#### (1) Data Collection
- The dataset is available in `backend/data/` (Telco customer churn CSV).
- Training uses the dataset to create features and labels.

#### (2) Data Preprocessing
Preprocessing is consistent across training and inference by using saved artifacts:
- Missing value handling (e.g., `TotalCharges` blanks)
- Label encoding for binary categorical features
- One-hot encoding for multi-category features
- Feature alignment using stored feature name ordering
- Scaling using a saved scaler

#### (3) Model Building
- Multiple classifiers are trained and compared.
- The selected model is stored as `best_model.pkl`.

#### (4) Model Evaluation
The model is evaluated using classification metrics and ROC-AUC. Results are saved into model metadata.

#### (5) Prediction System
The prediction system performs:
1. JWT verification using backend authentication dependencies.
2. Customer feature parsing via Pydantic schema.
3. Artifact-driven preprocessing and feature alignment.
4. Model inference to compute churn probability.
5. Feature importance extraction and confidence scoring.
6. Persistence of predictions in MongoDB.

---

## 7. Screenshots Section

> Add the required screenshots from the running application.

- **Figure 7.1:** Dashboard View — *(Insert screenshot here)*
- **Figure 7.2:** Prediction Form — *(Insert screenshot here)*
- **Figure 7.3:** Prediction Result & Risk Level — *(Insert screenshot here)*
- **Figure 7.4:** Prediction History — *(Insert screenshot here)*
- **Figure 7.5:** Analytics Insights — *(Insert screenshot here)*

---

## 8. Testing

### 8.1 Test Cases Table

| Test ID | Module | Scenario | Expected Output |
|---|---|---|---|
| TC-01 | Auth | Register new user with valid data | User created, JWT returned |
| TC-02 | Auth | Login with correct credentials | Access token returned |
| TC-03 | Auth | Invalid password | Authentication error |
| TC-04 | Prediction | Predict when model not trained | 503 ML model not loaded |
| TC-05 | Prediction | Valid request with JWT | Prediction response with probability and label |
| TC-06 | History | Fetch history with authentication | Paginated history items |
| TC-07 | History | Delete record owned by user | 200 success message |
| TC-08 | Analytics | Fetch summary insights | Summary JSON with trends |
| TC-09 | Input Validation | Missing feature field | 422 validation error |
| TC-10 | Input Validation | Wrong data type | 422 validation error |

### 8.2 Input vs Output Example

| Input (Key Fields) | Output (Key Fields) |
|---|---|
| tenure, monthly_charges, contract, payment_method, etc. | prediction (Churn/Not Churn), probability, confidence, top feature importance |

---

## 9. Results and Discussion

### 9.1 Model Accuracy
The trained system reports classification performance. For academic documentation, include the best model metrics from training metadata.

**Table Template:**

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | *(fill)* | *(fill)* | *(fill)* | *(fill)* | *(fill)* |
| Decision Tree | *(fill)* | *(fill)* | *(fill)* | *(fill)* | *(fill)* |
| Random Forest | *(fill)* | *(fill)* | *(fill)* | *(fill)* | *(fill)* |
| SVM | *(fill)* | *(fill)* | *(fill)* | *(fill)* | *(fill)* |
| **Best Model (Tuned RF)** | **0.8012** | **0.6734** | **0.7123** | **0.6923** | **0.8891** |

### 9.2 Confusion Matrix Explanation
A confusion matrix compares predicted vs. actual classes.

- **True Positives (TP):** churn correctly predicted as churn
- **True Negatives (TN):** non-churn correctly predicted as non-churn
- **False Positives (FP):** non-churn predicted as churn (false alarm)
- **False Negatives (FN):** churn predicted as non-churn (missed churn)

Discuss how the model balances these errors based on precision and recall.

### 9.3 Insights from Data
Key churn predictors commonly include:
- Short tenure (newer customers churn more)
- Month-to-month contracts
- Higher monthly charges
- Lack of support features (tech support / security)

Explain how feature importance supports these insights.

---

## 10. Future Scope

- Real-time prediction using WebSockets for batch inputs
- Deployment improvements: CI/CD pipelines and automated retraining
- Advanced explainability using SHAP values for robust interpretability
- Email or dashboard alerts for high-risk customers
- Role-based access (admin vs. analyst)
- Rate limiting and monitoring for production stability
- Export prediction reports to PDF

---

## 11. Conclusion

This project successfully integrates machine learning churn prediction with a secure full-stack web application. A classification model is trained using historical churn data and deployed via a FastAPI backend. The system produces churn predictions with probabilities and confidence levels while offering feature importance for explainability. MongoDB storage enables prediction history and analytics dashboards. Overall, the system provides both academic value (evaluation and documentation) and practical utility (interactive prediction and retention insights).

---

## 12. References

> Replace/expand with your exact reference list.

1. IBM Watson Analytics Telco Customer Churn dataset documentation.
2. scikit-learn User Guide: Classification metrics and model evaluation.
3. FastAPI Documentation: Security, routers, and request validation.
4. React Documentation: State management and component architecture.
5. MongoDB Documentation: Collections and indexing.

Websites:
- https://fastapi.tiangolo.com/
- https://react.dev/
- https://scikit-learn.org/
- https://www.mongodb.com/

Tools used:
- Docker / Docker Compose
- Tailwind CSS

---

## 13. Appendix

### 13.1 Sample Dataset Description
The dataset includes customer-level features such as:
- Demographics (e.g., gender, senior citizen)
- Service usage (phone service, internet service)
- Account and billing information (contract type, payment method, charges)
- Target label: `Churn` (Yes/No)

### 13.2 Code Snippets (Optional)
Include minimal excerpts such as:
- API prediction route structure
- ML preprocessing function and artifact loading

---

### Document Formatting Notes (for Word conversion)
- Use **Times New Roman, size 12**.
- Set **1.15–1.5 line spacing**.
- Set heading style for bold headings.
- Insert page numbers in Word footer.
- Replace diagram and screenshot placeholders with actual images.

