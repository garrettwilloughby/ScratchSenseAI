"use client";

export const analyzeVideo = async (file) => {
    console.log("why isnt this working")
    console.log("Running Analyze Function on", file)
    try {
        const response = await fetch("http://127.0.0.1:8080/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({filename: file }),
        });
        const data = await response.json();
        console.log(data.message);  // Log the message instead of setting state
    } catch (error) {
        console.log("Analysis failed.");  // Log the failure message
    }
};

export const createTrainingDataset = async () => {
  try {
    const response = await fetch("http://127.0.0.1:8080/create_training_dataset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log(data.message);  // Log the message instead of setting state
  } catch (error) {
    console.log("Failed to create training dataset.");  // Log the failure message
  }
};

export const trainNetwork = async () => {
  console.log("Training in progress...");  // Log the progress message
  try {
    const response = await fetch("http://127.0.0.1:8080/train_network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log(data.message);  // Log the message instead of setting state
  } catch (error) {
    console.log("Failed to train network.");  // Log the failure message
  }
};

export const evaluateNetwork = async () => {
  try {
    const response = await fetch("http://127.0.0.1:8080/evaluate_network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log(data.message);  // Log the message instead of setting state
  } catch (error) {
    console.log("Failed to evaluate network.");  // Log the failure message
  }
};

export const plotTrajectories = async (file) => {
  try {
    const response = await fetch("http://127.0.0.1:8080/plot_trajectories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file }),
    });
    const data = await response.json();
    console.log(data.message);  // Log the message instead of setting state
  } catch (error) {
    console.log("Failed to plot trajectories.");  // Log the failure message
  }
};

export const createLabeledVideo = async (file) => {
  //setting this up to take a video_path or folder, leaning towards video path
  try {
    const response = await fetch("http://127.0.0.1:8080/create_labeled_video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file }),
    });
    const data = await response.json();
    console.log(data.message);  // Log the message instead of setting state
  } catch (error) {
    console.log("Failed to create labeled video.");  // Log the failure message
  }
};

// Function to trigger DeepLabCut's extract_frames API
export const extractFrames = async (file) => {
  console.log("Extracting frames...");
  try {
    const response = await fetch("http://127.0.0.1:8080/extract_frames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({filename: file}),
    });
    const data = await response.json();
    console.log(data.message);  // Log the success message
  } catch (error) {
    console.log("Failed to extract frames.");  // Log the failure message
  }
};

// Function to trigger DeepLabCut's label_frames API
export const labelFrames = async () => {
  console.log("Opening labeling GUI...");
  try {
    const response = await fetch("http://127.0.0.1:8080/label_frames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log(data.message);  // Log the success message
  } catch (error) {
    console.log("Failed to open labeling GUI.");  // Log the failure message
  }
};

// Function to trigger DeepLabCut's check_labels API
export const checkLabels = async () => {
  console.log("Checking labels...");
  try {
    const response = await fetch("http://127.0.0.1:8080/check_labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log(data.message);  // Log the success message
  } catch (error) {
    console.log("Failed to check labels.");  // Log the failure message
  }
};
