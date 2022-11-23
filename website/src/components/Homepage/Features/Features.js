import React from 'react';
import './Features.css';

const Features = ({ Svg, image, title, description }) => {
  const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

  // not trivial to use svg with safari
  return (
    <div className="col col--4 features-gap">
      <div>{isSafari ? <img src={image} /> : <Svg className="feature-image" alt={title} />}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default Features;
