
import os
import h5py
import pandas as pd
import numpy as np
import json
from sklearn.tree import DecisionTreeClassifier
from app.utils.file_helpers import commit_results, commit_overall


def smooth_low_conf_points(df, likelihood_col, x_col, y_col, threshold=0.5, window=4):
    x_smooth, y_smooth = df[x_col].copy(), df[y_col].copy()
    for i in range(len(df)):
        if df[likelihood_col].iloc[i] >= threshold:
            continue
        neighbors = [(df[x_col].iloc[j], df[y_col].iloc[j])
                     for j in range(max(0, i - window), min(len(df), i + window + 1))
                     if j != i and df[likelihood_col].iloc[j] >= threshold]
        if neighbors:
            x_vals, y_vals = zip(*neighbors)
            x_smooth.iat[i] = np.mean(x_vals)
            y_smooth.iat[i] = np.mean(y_vals)
    return x_smooth, y_smooth


def compute_angle(p1, p2, p3):
    a, b, c = np.array(p1), np.array(p2), np.array(p3)
    ba, bc = a - b, c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba)
                                  * np.linalg.norm(bc) + 1e-6)
    return np.arccos(np.clip(cos_angle, -1.0, 1.0)) * 180 / np.pi


def reinforce_scratch_sequences(pred, gap_tolerance=1, min_length=3, extend=2):
    smoothed = np.zeros_like(pred)
    i = 0
    while i < len(pred):
        if pred[i] == 0:
            i += 1
            continue
        start, end = i, i
        gap = 0
        while end + 1 < len(pred) and (pred[end + 1] == 1 or gap < gap_tolerance):
            end += 1
            gap = 0 if pred[end] == 1 else gap + 1
        if end - start + 1 >= min_length:
            smoothed[max(0, start - extend):min(len(pred), end + extend + 1)] = 1
        i = end + 1
    return smoothed


def final_ultra_model_v3_precision_tuned(df):
    df["backleft_x_smooth"], df["backleft_y_smooth"] = smooth_low_conf_points(
        df, "backleft_likelihood", "backleft_x", "backleft_y")
    df["backright_x_smooth"], df["backright_y_smooth"] = smooth_low_conf_points(
        df, "backright_likelihood", "backright_x", "backright_y")
    df["nose_x_smooth"], df["nose_y_smooth"] = smooth_low_conf_points(
        df, "nose_likelihood", "nose_x", "nose_y")

    df["backleft_neck_dist_smooth"] = np.sqrt(
        (df["backleft_x_smooth"] - df["nose_x_smooth"])**2 + (df["backleft_y_smooth"] - df["nose_y_smooth"])**2)

    df["curl_angle_smooth"] = [
        compute_angle((df.at[i, "nose_x_smooth"], df.at[i, "nose_y_smooth"]),
                      (df.at[i, "tail_x"], df.at[i, "tail_y"]),
                      (df.at[i, "backleft_x_smooth"], df.at[i, "backleft_y_smooth"])) if i > 0 else 0
        for i in range(len(df))
    ]

    df["backleft_accel_smooth"] = np.sqrt(df["backleft_x_smooth"].diff(
    )**2 + df["backleft_y_smooth"].diff()**2).diff().abs().fillna(0)
    df["diff_motion"] = (df["backleft_y_smooth"].diff() -
                         df["backright_y_smooth"].diff()).abs().fillna(0)
    df["cross_body_dist"] = np.sqrt(
        (df["backleft_x_smooth"] - df["frontright_x"])**2 + (df["backleft_y_smooth"] - df["frontright_y"])**2)
    df["rolling_std"] = df["backleft_y_smooth"].rolling(
        window=5, center=True).std().fillna(0)

    df["scratch_score"] = ((df["backleft_neck_dist_smooth"] < 80).astype(int) * 3 +
                           (df["cross_body_dist"] < 150).astype(int) * 3 +
                           (df["curl_angle_smooth"] < 60).astype(int) * 2 +
                           (df["diff_motion"] > 0.5).astype(int) * 2 +
                           (df["rolling_std"] > 0.5).astype(int) * 1 +
                           (df["backleft_accel_smooth"] > 0.8).astype(int) * 1)

    df["curl_angle_rollmean"] = df["curl_angle_smooth"].rolling(
        3, center=True).mean().bfill().ffill()
    df["accel_rollmean"] = df["backleft_accel_smooth"].rolling(
        3, center=True).mean().bfill().ffill()
    df["neck_dist_rollmean"] = df["backleft_neck_dist_smooth"].rolling(
        3, center=True).mean().bfill().ffill()
    df["curl_angle_delta"] = df["curl_angle_smooth"].diff().abs().fillna(0)
    df["accel_delta"] = df["backleft_accel_smooth"].diff().abs().fillna(0)
    df["temporal_score"] = ((df["curl_angle_rollmean"] < 70).astype(int) +
                            (df["accel_rollmean"] > 1.0).astype(int) +
                            (df["neck_dist_rollmean"] < 100).astype(int) +
                            (df["curl_angle_delta"] > 5).astype(int) +
                            (df["accel_delta"] > 1.5).astype(int)) / 5.0

    vel_l = np.sqrt(df["backleft_x_smooth"].diff()**2 +
                    df["backleft_y_smooth"].diff()**2).fillna(0)
    vel_r = np.sqrt(df["backright_x_smooth"].diff()**2 +
                    df["backright_y_smooth"].diff()**2).fillna(0)
    df["asymmetry_score_norm"] = np.abs(vel_l - vel_r)
    df["asymmetry_score_norm"] = (
        df["asymmetry_score_norm"] - df["asymmetry_score_norm"].min()) / (df["asymmetry_score_norm"].max() + 1e-6)

    dx_traj = df["nose_x_smooth"] - df["backleft_x_smooth"]
    dy_traj = df["nose_y_smooth"] - df["backleft_y_smooth"]
    trajectory_angle = np.arctan2(dy_traj, dx_traj) * (180 / np.pi)
    trajectory_angle_diff = trajectory_angle.diff().abs().fillna(0)
    trajectory_angle_diff = np.where(
        trajectory_angle_diff > 180, 360 - trajectory_angle_diff, trajectory_angle_diff)
    angle_var_norm = 1 - pd.Series(trajectory_angle_diff).rolling(
        5, center=True).std().fillna(0) / (trajectory_angle_diff.max() + 1e-6)

    features = ["backleft_neck_dist_smooth", "cross_body_dist", "curl_angle_smooth",
                "diff_motion", "rolling_std", "backleft_accel_smooth"]
    X = df[features]
    df["is_scratch"] = ((df["scratch_score"] >= 7).astype(int))
    tree = DecisionTreeClassifier(
        max_depth=3, random_state=42).fit(X, df["is_scratch"])
    tree_conf = tree.predict_proba(X)[:, 1]

    final_conf = (0.75 * tree_conf +
                  0.05 * df["asymmetry_score_norm"] +
                  0.05 * angle_var_norm +
                  0.15 * df["temporal_score"]).clip(0, 1)

    penalty = (
        (df["backleft_accel_smooth"] > 15).astype(int) * 0.08 +
        (df["curl_angle_smooth"] > 90).astype(int) * 0.08 +
        ((df["backleft_accel_smooth"] > 10) &
         (df["curl_angle_smooth"] < 30)).astype(int) * 0.10
    )
    final_conf_filtered = (final_conf - penalty).clip(0, 1)

    pred = (final_conf_filtered > 0.575).astype(int)
    smoothed_pred = reinforce_scratch_sequences(pred)

    return smoothed_pred, final_conf_filtered


def process_h5_to_json(h5_path):
    video_id = os.path.basename(h5_path).split('_')[0]
    with h5py.File(h5_path, "r") as h5_file:
        dataset = h5_file["/df_with_missing/table"]
        values_block = dataset["values_block_0"][:]

    column_names = [
        "nose_x", "nose_y", "nose_likelihood",
        "tail_x", "tail_y", "tail_likelihood",
        "frontleft_x", "frontleft_y", "frontleft_likelihood",
        "frontright_x", "frontright_y", "frontright_likelihood",
        "backleft_x", "backleft_y", "backleft_likelihood",
        "backright_x", "backright_y", "backright_likelihood"
    ]

    df = pd.DataFrame(values_block, columns=column_names)
    predictions, _ = final_ultra_model_v3_precision_tuned(df)

    scratch_instances = []
    i = 0
    while i < len(predictions):
        if predictions[i] == 1:
            start = i
            while i < len(predictions) and predictions[i] == 1:
                i += 1
            duration = i - start
            scratch_instances.append((start, duration))
        else:
            i += 1

    output = {
        "video_results": [
            {
                "timestamp": round(frame / 20, 3),
                "video_id": video_id,
                "classification": "truePositive",
                "source": "Model",
                "duration": (duration / 20),
                "sequence_number": idx + 1
            }
            for idx, (frame, duration) in enumerate(scratch_instances)
        ],
        "overall_results": [
            {
                "video_id": video_id,
                "scratch_instances": len(scratch_instances),
                "duration_seconds": round(sum(d for _, d in scratch_instances) / 20.0, 3)
            }
        ]
    }

    output_json = json.dumps([output], indent=4)
    commit_results(output["video_results"])
    commit_overall(output["overall_results"])

    print(output_json)


def main(input_h5):
    # === USER-DEFINED INPUT PATHS ===
    print(f"Processing: {input_h5}")
    process_h5_to_json(input_h5)


if __name__ == "__main__":
    main()
