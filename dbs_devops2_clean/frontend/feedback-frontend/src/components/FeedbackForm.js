import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./FeedbackForm.css"; // We'll create this CSS file

const FeedbackForm = ({ onFeedbackAdded }) => {
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    productId: "",
    customerName: "",
    comment: "",
    rating: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "rating" || name === "productId" ? parseInt(value) || "" : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post("http://localhost:8085/feedback/submit", {
        ...formData,
        productId: parseInt(formData.productId),
        rating: parseInt(formData.rating),
      });
      
      // Clear form
      setFormData({
        userName: "",
        userEmail: "",
        productId: "",
        customerName: "",
        comment: "",
        rating: 1,
      });
      
      // Trigger refresh
      if (onFeedbackAdded) {
        onFeedbackAdded();
      }
      
      alert("Feedback submitted successfully!");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <div className="feedback-header">
          <h2>Share Your Feedback</h2>
          <p>We value your opinion! Please share your experience with us.</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userName">Your Name *</label>
              <input
                id="userName"
                name="userName"
                type="text"
                placeholder="Enter your full name"
                value={formData.userName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userEmail">Email Address *</label>
              <input
                id="userEmail"
                name="userEmail"
                type="email"
                placeholder="your.email@example.com"
                value={formData.userEmail}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="productId">Product ID *</label>
              <input
                id="productId"
                name="productId"
                type="number"
                placeholder="Product identifier"
                value={formData.productId}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                placeholder="Customer's name"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Feedback *</label>
            <textarea
              id="comment"
              name="comment"
              placeholder="Share your detailed feedback here..."
              value={formData.comment}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rating">Rating *</label>
            <div className="rating-container">
              <input
                id="rating"
                name="rating"
                type="range"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                className="rating-slider"
              />
              <div className="rating-display">
                <span className="rating-stars">
                  {"★".repeat(formData.rating)}{"☆".repeat(5 - formData.rating)}
                </span>
                <span className="rating-value">({formData.rating}/5)</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
            
            <button 
              type="button" 
              onClick={goToDashboard}
              className="dashboard-btn"
            >
              View Insights
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;