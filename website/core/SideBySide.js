import React from "react";

export function SideBySideOption({ children }) {
  return <div>{children}</div>;
}

export default class SideBySide extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null
    };
  }

  selectOption(name) {
    this.setState({
      selectedOption: name
    });
  }

  renderControls() {
    const options = React.Children.map(
      this.props.children,
      child => child.props.name
    );

    return (
      <div className="side-by-side-controls">
        {options.map(option => (
          <a key={option} onClick={this.selectOption.bind(this, option)}>
            {option}
          </a>
        ))}
      </div>
    );
  }

  render() {
    const { selectedOption } = this.state;
    const children = React.Children.toArray(this.props.children);
    const selectedChild = selectedOption
      ? children.find(({ props }) => props.name === selectedOption)
      : children[0];

    return (
      <div>
        {this.renderControls()}
        <div>{selectedChild}</div>
      </div>
    );
  }
}
