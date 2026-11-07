import { Component } from "react";
// Keep a failed route/import from taking the persistent audio root down with it.
export default class RouteBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="studio-section studio-route-error" role="alert">
        <p className="studio-kicker">A brief intermission</p>
        <h1>We couldn’t open this page.</h1>
        <p className="studio-muted">
          Your listening session is still here. Explore the collection while we
          find the next sound.
        </p>
        <a href="/" className="studio-button">
          Back to discovery
        </a>
      </section>
    );
  }
}
