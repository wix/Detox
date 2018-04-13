import React from "react";
import styled from "styled-components";

const Option = styled.div``;
const ControlPanel = styled.div`
  border-bottom: 1px solid #333;
  margin-bottom: 1em;
  margin-top: 1em;
  padding-bottom: 0.1em;
`;
const Control = styled.a`
  background-color: ${props => (props.active ? "#F2F2F2" : "white")};
  border: 1px solid #333;
  border-radius: 5px;
  cursor: pointer;
  display: inline-block;
  font-weight: bold;
  font-size: 1.5em;
  padding: 0.3em;
  margin-right: 0.5em;
`;

export function SideBySideOption({ children }) {
  return <Option>{children}</Option>;
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

  renderControls(selectedOption) {
    const options = React.Children.map(
      this.props.children,
      child => child.props.name
    );

    return (
      <ControlPanel>
        {options.map(option => (
          <Control
            key={option}
            active={selectedOption === option}
            onClick={this.selectOption.bind(this, option)}
          >
            {option}
          </Control>
        ))}
      </ControlPanel>
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
        {this.renderControls(selectedOption || children[0].props.name)}
        <div>{selectedChild}</div>
      </div>
    );
  }
}
