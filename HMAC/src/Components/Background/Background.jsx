import "./Background.css";

// Fixed notebook page behind the app: grain, faint ruled lines, red margin and punch holes.
const Background = () => (
  <div className="paper-bg" aria-hidden="true">
    <div className="paper-bg__rules" />
    <div className="paper-bg__margin" />
    <div className="paper-bg__holes">
      <span />
      <span />
      <span />
    </div>
    <div className="paper-bg__grain" />
  </div>
);

export default Background;
