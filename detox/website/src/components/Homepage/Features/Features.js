import React from 'react';
import './Features.css';

const Features = ({ Svg, title, description }) => {
  return (
    <div className="col col--4 features-gap">
      <Svg className="feature-image" alt={title} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default Features;
