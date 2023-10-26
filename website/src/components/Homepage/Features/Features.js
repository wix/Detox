import React from 'react';
import './Features.scss';

const Features = ({ Svg, title, description }) => {
  return (
    <div className="col col--4 features-gap">
      <Svg className="feature-image" alt={title} />
      <div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-text">{description}</p>
      </div>
    </div>
  );
};

export default Features;
