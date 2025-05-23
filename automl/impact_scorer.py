import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
# import autokeras as ak # Disabling AutoKeras
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Define file paths (adjust if your files are elsewhere)
# Assuming 'GSF Registry Projects Export 2025-05-12.csv' is in the root of the workspace
DATASET1_PATH = "../GSF Registry Projects Export 2025-05-12.csv"
# DATASET2_PATH = "../temp.csv" # Path for dataset 2 if needed later
OUTPUT_JSON_PATH = "impact_scores.json"
MODEL_PATH = "impact_model.h5" 

# --- Configuration ---
TARGET_COUNTRY = "India"
RELEVANT_STATUSES = ["Gold Standard Certified Project"] # Adjusted based on actual values
MIN_ESTIMATED_CREDITS = 1 # Projects must have some estimated credits
N_PROJECTS_FOR_JSON = 10 # Number of projects to save in the JSON output
RANDOM_STATE = 42

# --- Helper Functions ---

def parse_sdgs(sdg_string):
    if pd.isna(sdg_string) or sdg_string.strip() == "":
        return []
    # Example: "SDG 1 - No Poverty, SDG 2 - Zero Hunger" -> ["SDG 1", "SDG 2"]
    # Or "1,2,13" -> ["SDG 1", "SDG 2", "SDG 13"]
    # Normalize to "SDG X" format
    sdgs = []
    parts = sdg_string.split(',')
    for part in parts:
        part = part.strip()
        num = ''.join(filter(str.isdigit, part))
        if num:
            sdgs.append(f"SDG {num}")
    return list(set(sdgs)) # Return unique SDGs

# --- Main Script ---

def preprocess_data_for_manual_keras(df_raw):
    print("\n--- Starting Preprocessing for Manual Keras Model ---")
    df = df_raw.copy()
    df.columns = df.columns.str.replace('\s+', '_', regex=True)
    if 'Estimated_Annual_Credits' not in df.columns and 'Estimated Annual Credits' in df.columns:
         df.rename(columns={'Estimated Annual Credits': 'Estimated_Annual_Credits'}, inplace=True)

    print(f"Initial rows: {len(df)}")

    if 'Status' in df.columns:
        df = df[df['Status'].isin(RELEVANT_STATUSES)]
        print(f"Rows after Status filter ({RELEVANT_STATUSES}): {len(df)}")
    else:
        print("Warning: 'Status' column not found."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []

    if 'Country' in df.columns:
        df['Country'] = df['Country'].fillna('Unknown')
        df = df[df['Country'] == TARGET_COUNTRY]
        print(f"Rows after Country filter ('{TARGET_COUNTRY}'): {len(df)}")
        if len(df) == 0: print(f"No projects for {TARGET_COUNTRY}."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []
    else:
        print("Warning: 'Country' column not found."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []

    if 'Estimated_Annual_Credits' not in df.columns: 
        print("Error: 'Estimated_Annual_Credits' missing."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []
        
    df['Estimated_Annual_Credits'] = pd.to_numeric(df['Estimated_Annual_Credits'], errors='coerce')
    df = df.dropna(subset=['Estimated_Annual_Credits'])
    df = df[df['Estimated_Annual_Credits'] >= MIN_ESTIMATED_CREDITS]
    print(f"Rows after Estimated_Annual_Credits filter (>= {MIN_ESTIMATED_CREDITS}): {len(df)}")
    
    if len(df) < 10: 
        print("Warning: Very few rows after filtering.")
        if len(df) == 0: return pd.DataFrame(), pd.Series(dtype='float64'), None, []

    if 'Sustainable_Development_Goals' in df.columns:
        df['Sustainable_Development_Goals'] = df['Sustainable_Development_Goals'].fillna('')
        df['Parsed_SDGs'] = df['Sustainable_Development_Goals'].apply(parse_sdgs)
        df['SDG_Count'] = df['Parsed_SDGs'].apply(len)
        temp_sdg_list = []
        for slist in df['Parsed_SDGs']: temp_sdg_list.extend(slist)
        all_found_sdgs = sorted(list(set(temp_sdg_list)))
        print(f"Found SDGs after filtering: {all_found_sdgs}")
        for sdg in all_found_sdgs:
            df[f'Has_{sdg.replace(" ", "_")}'] = df['Parsed_SDGs'].apply(lambda x: 1 if sdg in x else 0)
    else:
        df['SDG_Count'] = 0

    df['ImpactScore_Log'] = np.log1p(df['Estimated_Annual_Credits'])
    scaler_target = MinMaxScaler(feature_range=(0, 100))
    df['ImpactScore'] = scaler_target.fit_transform(df[['ImpactScore_Log']])
    print("ImpactScore (Target Variable) distribution:"); print(df['ImpactScore'].describe())

    categorical_features = ['Project_Type', 'Size'] # Simplified, Programme_of_Activities often sparse or complex
    if 'Programme_of_Activities' in df.columns:
         categorical_features.append('Programme_of_Activities')
    else:
        print("Warning: 'Programme_of_Activities' column not found, excluding from features.")

    sdg_flag_cols = [col for col in df.columns if col.startswith('Has_SDG')]
    numeric_features = ['SDG_Count'] + sdg_flag_cols
    
    final_cat_features = [col for col in categorical_features if col in df.columns]
    final_num_features = [col for col in numeric_features if col in df.columns]

    if not final_cat_features and not final_num_features:
        print("Error: No features available."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []

    print(f"Selected categorical features for Keras: {final_cat_features}")
    print(f"Selected numeric features for Keras: {final_num_features}")

    X = df[final_cat_features + final_num_features]
    y = df['ImpactScore']

    # Define preprocessor for ColumnTransformer
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, final_num_features),
            ('cat', categorical_transformer, final_cat_features)])

    if X.empty or y.empty: 
        print("Error: X or y empty."); return pd.DataFrame(), pd.Series(dtype='float64'), None, []
        
    print("--- Preprocessing for Manual Keras Complete ---")
    return X, y, df, preprocessor # Return preprocessor to be fit on train and transform test


def train_model_manual_keras(X_train_processed, y_train, X_test_processed, y_test, input_shape):
    print("\n--- Training Model with Manual Keras ---")
    model = Sequential([
        Dense(128, activation='relu', input_shape=(input_shape,)),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dense(1) # Output layer for regression (ImpactScore)
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mean_absolute_error'])
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
    
    history = model.fit(
        X_train_processed, y_train,
        epochs=100, # Increased epochs, early stopping will manage
        validation_data=(X_test_processed, y_test),
        callbacks=[early_stopping],
        batch_size=32,
        verbose=1
    )
    
    loss, mae = model.evaluate(X_test_processed, y_test, verbose=0)
    print(f"Keras Test Loss (MSE): {loss}, Test MAE: {mae}")
    
    model.save(MODEL_PATH)
    print(f"Manual Keras model saved to {MODEL_PATH}")
    return model

# generate_output_json remains largely the same but ensure X_sample_features is preprocessed by the *fitted* preprocessor
def generate_output_json(model, full_df_processed, X_unprocessed_sample, preprocessor_fitted, n_projects):
    print(f"\n--- Generating Output JSON for {n_projects} projects (Manual Keras) ---")
    if model is None or X_unprocessed_sample.empty or full_df_processed.empty or preprocessor_fitted is None:
        print("Cannot generate JSON: Model/data/preprocessor missing.")
        error_data = {"error": "Model training failed or no data/preprocessor for prediction."}
        with open(OUTPUT_JSON_PATH, 'w') as f:
            import json; json.dump(error_data, f, indent=4)
        return

    # Preprocess the X_unprocessed_sample using the *fitted* preprocessor
    X_sample_processed = preprocessor_fitted.transform(X_unprocessed_sample)
    
    predictions = model.predict(X_sample_processed)
    
    output_data = []
    sample_indices = X_unprocessed_sample.index # Get original indices from the unprocessed sample

    for i, pred_score in enumerate(predictions):
        original_project_info = full_df_processed.loc[sample_indices[i]]
        project_data = {
            "GSID": int(original_project_info.get('GSID', 0)),
            "Project_Name": original_project_info.get('Project_Name', 'N/A'),
            "Country": original_project_info.get('Country', 'N/A'),
            "Project_Type": original_project_info.get('Project_Type', 'N/A'),
            "Estimated_Annual_Credits": int(original_project_info.get('Estimated_Annual_Credits', 0)),
            "Parsed_SDGs": original_project_info.get('Parsed_SDGs', []),
            "Predicted_Impact_Score": float(pred_score.flatten()[0])
        }
        output_data.append(project_data)
            
    print(f"Generated predictions for {len(output_data)} projects.")
    
    try:
        with open(OUTPUT_JSON_PATH, 'w') as f:
            import json; json.dump(output_data, f, indent=4)
        print(f"Successfully saved predictions to {OUTPUT_JSON_PATH}")
    except Exception as e:
        print(f"Error saving JSON: {e}")


# --- Main Execution ---
if __name__ == "__main__":
    print("Attempting to load Dataset 1 for Impact Scoring Model (Manual Keras)...")
    df_raw = pd.read_csv(DATASET1_PATH, low_memory=False)

    if df_raw is not None and not df_raw.empty:
        print(f"Successfully loaded raw data: {len(df_raw)} rows")
        
        X_unprocessed, y, df_processed, preprocessor = preprocess_data_for_manual_keras(df_raw)

        if not X_unprocessed.empty and not y.empty and preprocessor is not None:
            X_train_unprocessed, X_test_unprocessed, y_train, y_test = train_test_split(
                X_unprocessed, y, test_size=0.2, random_state=RANDOM_STATE
            )
            
            # Fit preprocessor on training data and transform both train and test
            X_train_processed = preprocessor.fit_transform(X_train_unprocessed)
            X_test_processed = preprocessor.transform(X_test_unprocessed)
            
            # AutoKeras might produce sparse matrix if it does OHE. Manual Keras usually dense.
            # If X_train_processed is sparse, convert to dense for Keras Dense layers
            if hasattr(X_train_processed, "toarray"):
                X_train_processed = X_train_processed.toarray()
                X_test_processed = X_test_processed.toarray()

            print(f"X_train_processed shape: {X_train_processed.shape}, y_train shape: {y_train.shape}")
            print(f"X_test_processed shape: {X_test_processed.shape}, y_test shape: {y_test.shape}")

            model = train_model_manual_keras(
                X_train_processed, y_train, 
                X_test_processed, y_test, 
                input_shape=X_train_processed.shape[1]
            )
            
            if model:
                # For JSON output, sample from the *unprocessed* X then transform for prediction
                if len(X_unprocessed) >= N_PROJECTS_FOR_JSON:
                     X_sample_unprocessed_for_json = X_unprocessed.sample(n=N_PROJECTS_FOR_JSON, random_state=RANDOM_STATE)
                else: 
                     X_sample_unprocessed_for_json = X_unprocessed.copy()
                
                generate_output_json(model, df_processed, X_sample_unprocessed_for_json, preprocessor, N_PROJECTS_FOR_JSON)
            else:
                print("Manual Keras model training failed. JSON with error message generated.")
                generate_output_json(None, pd.DataFrame(), pd.DataFrame(), None, N_PROJECTS_FOR_JSON)
        else:
            print("Preprocessing failed or resulted in no data. Skipping model training.")
            error_data = {"error": "Preprocessing failed or no data for Keras model."}
            with open(OUTPUT_JSON_PATH, 'w') as f:
                import json; json.dump(error_data, f, indent=4)
    else:
        print(f"Failed to load data from {DATASET1_PATH}. Cannot proceed.")
        error_data = {"error": f"Failed to load data from {DATASET1_PATH}."}
        with open(OUTPUT_JSON_PATH, 'w') as f:
            import json; json.dump(error_data, f, indent=4)

    print("\n--- Impact Scoring Script Finished (Manual Keras) ---") 