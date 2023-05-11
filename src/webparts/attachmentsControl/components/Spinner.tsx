import * as React from "react";
import "./spinner.css";
import { useState } from "react";

export default function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <div className="loading-spinner">
      </div>
    </div>
  );
}

