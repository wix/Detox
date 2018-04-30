const React = require("react");

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
    console.log("FOOO");
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
      <div
        style={{
          borderBottom: "1px solid #333",
          marginBottom: "1em",
          marginTop: "1em",
          paddingBottom: "0.1em"
        }}
      >
        {options.map(option => (
          <a
            key={option}
            onClick={this.selectOption.bind(this, option)}
            style={{
              backgroundColor: selectedOption === option ? "#F2F2F2" : "white",
              border: "1px solid #333",
              borderRadius: "5px",
              cursor: "pointer",
              display: "inline-block",
              fontWeight: "bold",
              fontSize: "1.5em",
              padding: "0.3em",
              marginRight: "0.5em",
              userSelect: "none"
            }}
          >
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
        {this.renderControls(selectedOption || children[0].props.name)}
        <div>{selectedChild}</div>
      </div>
    );
  }
}
