import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import styles from './Reviews.module.css';
import { getImageUrl } from '../../utils/imageUrl';
import { FiStar } from 'react-icons/fi';
import Pagination from '../../components/Pagination';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/api/doctors/reviews/me?page=${currentPage}&limit=${itemsPerPage}`);
        setReviews(res.data.reviews || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [currentPage]);

  const averageRating = total > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  if (loading) return <div>Loading practitioner reviews...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Patient Satisfaction & Reviews</h1>
        <div className={styles.ratingOverview}>
          <div className={styles.ratingValue}>{averageRating}</div>
          <div className={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <FiStar 
                key={i} 
                className={i < Math.round(averageRating) ? styles.starFilled : styles.starEmpty} 
              />
            ))}
          </div>
          <div className={styles.ratingCount}>Based on {reviews.length} clinical interactions</div>
        </div>
      </header>

      <div className={styles.reviewsGrid}>
        {reviews.length > 0 ? reviews.map((review) => (
          <div key={review._id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.patientAvatar}>
                {review.patient?.profilePicture ? (
                  <img src={getImageUrl(review.patient.profilePicture)} alt="Avatar" />
                ) : (
                  review.patient?.name?.charAt(0) || 'P'
                )}
              </div>
              <div>
                <div className={styles.patientName}>{review.patient?.name || 'Anonymous Patient'}</div>
                <div className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</div>
              </div>
              <div className={styles.reviewRating}>
                {[...Array(review.rating)].map((_, i) => <FiStar key={i} className={styles.starSmall} />)}
              </div>
            </div>
            <div className={styles.reviewComment}>
              "{review.comment || 'No feedback provided.'}"
            </div>
          </div>
        )) : (
          <div className={styles.noReviews}>No patient reviews found in your profile.</div>
        )}
      </div>

      {total > itemsPerPage && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil(total / itemsPerPage)} 
          onPageChange={setCurrentPage} 
        />
      )}
    </div>
  );
};

export default Reviews;
