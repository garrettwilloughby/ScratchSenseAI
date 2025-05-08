import { Row, Col } from "react-bootstrap"

const EvaluationMetrics = () => {
  return (
    <div className="container p-10 mt-5">
    <div>
      <h3 className="mb-3 fw-bold">Model Performance</h3>

      <Row className="mb-4">
        <Col md={3}>
          <div className="border rounded p-3 h-100">
            <div className="text-muted small mb-1">Accuracy</div>
            <h3 className="mb-0">92.43%</h3>
          </div>
        </Col>
        <Col md={3}>
          <div className="border rounded p-3 h-100">
            <div className="text-muted small mb-1">Precision</div>
            <h3 className="mb-0">77.84%</h3>
          </div>
        </Col>
        <Col md={3}>
          <div className="border rounded p-3 h-100">
            <div className="text-muted small mb-1">Recall</div>
            <h3 className="mb-0">85.35%</h3>
          </div>
        </Col>
        <Col md={3}>
          <div className="border rounded p-3 h-100">
            <div className="text-muted small mb-1">F1 Score</div>
            <h3 className="mb-0">81.42%</h3>
          </div>
        </Col>
      </Row>

      <div
        style={{ height: "400px" }}
        className="d-flex align-items-center justify-content-center bg-light rounded mb-3"
      >
        {/* confusion matrix */}
        <div className="text-center text-muted">
                <img
          src="/images/confusion-matrix.png"
          alt="Confusion Matrix"
          className="img-fluid"
        />
        </div>
      </div>
      <div className="text-muted small">
        <p>
          The model shows strong performance with high accuracy and balanced precision/recall metrics. The confusion
          matrix shows minimal false positives and false negatives.
        </p>
      </div>
    </div>
    </div>
  )
}

export default EvaluationMetrics