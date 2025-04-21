import React from 'react';
import Slider from 'react-slick';

const PhotoCarousel = ({ title, photos, rejectionReasons }) => {
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 2,
    responsive: [
      {
        breakpoint: 768,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  };

  return (
    <div className="carousel-wrapper">
      <h2>{title}</h2>
      <Slider {...settings}>
        {photos.map((photo, index) => (
          <div key={index} style={{ padding: 10 }}>
            <img
              src={photo.url}
              alt={`photo-${index}`}
              className="carousel-image"
            />
            {rejectionReasons && (
              <p style={{ color: '#d00', fontSize: '0.85rem' }}>
                {rejectionReasons[photo.reason]}
              </p>
            )}
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default PhotoCarousel;
