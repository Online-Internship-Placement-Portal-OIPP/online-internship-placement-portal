import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import testsApi from '../api/testsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';

export const TakeTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test progression state
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Submission state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const isSubmittedRef = useRef(isSubmitted);
  isSubmittedRef.current = isSubmitted;

  // Load test data
  useEffect(() => {
    let isMounted = true;

    const fetchTestData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await testsApi.getTest(id);
        const data = response.data || response;
        if (isMounted) {
          setTest(data);
          setTimeLeft((data.durationMinutes || 0) * 60);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load test details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTestData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Submit handler
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmittedRef.current) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const currentAnswers = answersRef.current;
    const formattedAnswers = Object.entries(currentAnswers).map(
      ([questionId, selectedOption]) => ({
        questionId,
        selectedOption: Number(selectedOption),
      })
    );

    try {
      const response = await testsApi.submitTest(id, formattedAnswers);

      setIsSubmitted(true);
      const resultId =
        response?.data?.resultId ||
        response?.resultId ||
        response?.data?.data?.resultId;

      if (resultId) {
        navigate(`/results/${resultId}`);
      } else {
        navigate('/results');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit test answers. Please try again.');
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  }, [id, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isSubmitted, handleFinalSubmit]);

  // Beforeunload warning while test is active
  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStarted, isSubmitted]);

  // Option selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading test questions..." />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="page-container">
        <Alert type="error" message={error || 'Test not found.'} />
        <Link to="/tests" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
          &larr; Back to Tests
        </Link>
      </div>
    );
  }

  const questions = test.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const unansweredCount = questions.filter((q) => answers[q.id] === undefined).length;

  // 1. Start Screen
  if (!isStarted) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-4)' }}>
            <span
              className="badge"
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
              }}
            >
              {test.category}
            </span>
            <h1 style={{ marginTop: 'var(--space-2)' }}>{test.title}</h1>
            {test.description && (
              <p style={{ color: 'var(--color-muted)' }}>{test.description}</p>
            )}
          </header>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-5)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>
                DURATION
              </strong>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {test.durationMinutes} minutes
              </span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>
                QUESTIONS
              </strong>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {totalQuestions} questions
              </span>
            </div>
          </div>

          <section style={{ marginBottom: 'var(--space-5)' }}>
            <h2>Test Rules & Instructions</h2>
            <ul style={{ paddingLeft: 'var(--space-4)', lineHeight: 1.8 }}>
              <li>Each question has multiple choices with one correct option.</li>
              <li>You can navigate back and forth using the Previous and Next buttons.</li>
              <li>Use the question palette to jump directly to any question at any time.</li>
              <li>The countdown timer starts as soon as you click <strong>Begin</strong>.</li>
              <li>Unanswered questions will receive 0 marks. There is no negative marking.</li>
              <li>When the timer reaches 00:00, your test will automatically be submitted.</li>
            </ul>
          </section>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsStarted(true)}
              style={{ padding: 'var(--space-3) var(--space-6)' }}
            >
              Begin
            </button>
            <Link to="/tests" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Test-Taking Screen
  return (
    <div className="page-container">
      {submitError && (
        <Alert type="error" message={submitError} onClose={() => setSubmitError(null)} />
      )}

      {/* Top Header: Title, Question progress, and Countdown Timer */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{test.title}</h2>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div
          role="timer"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: timeLeft <= 60 ? 'var(--color-danger-bg)' : 'var(--color-bg)',
            color: timeLeft <= 60 ? 'var(--color-danger)' : 'var(--color-text)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: 'var(--font-size-lg)',
            border: `1px solid ${timeLeft <= 60 ? 'var(--color-danger)' : 'var(--color-border)'}`,
          }}
        >
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
        aria-label="Test progress"
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--color-border-light)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
            backgroundColor: 'var(--color-primary)',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}
      >
        {/* Question Area */}
        <div className="card">
          {currentQuestion && (
            <fieldset
              style={{
                border: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--font-size-lg)',
                  marginBottom: 'var(--space-4)',
                  display: 'block',
                  width: '100%',
                }}
              >
                {currentQuestion.text}
              </legend>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {currentQuestion.options.map((option, idx) => {
                  const isChecked = answers[currentQuestion.id] === idx;
                  return (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius)',
                        border: `1px solid ${
                          isChecked ? 'var(--color-primary)' : 'var(--color-border)'
                        }`,
                        backgroundColor: isChecked
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={idx}
                        checked={isChecked}
                        onChange={() => handleAnswerSelect(currentQuestion.id, idx)}
                        style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-base)' }}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-border-light)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              &larr; Previous
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentIndex === totalQuestions - 1}
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Sidebar: Question Palette & Submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-3)' }}>
              Question Palette
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)', marginBottom: 'var(--space-3)' }}>
              Click any question to jump directly.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'var(--space-2)',
              }}
              aria-label="Question palette"
            >
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Question ${idx + 1}${isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    style={{
                      padding: 'var(--space-2)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: isCurrent ? 700 : 500,
                      border: isCurrent
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isAnswered
                        ? 'var(--color-success-bg)'
                        : 'var(--color-surface)',
                      color: isAnswered ? 'var(--color-success)' : 'var(--color-text)',
                    }}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && (
                      <span aria-hidden="true" style={{ fontWeight: 'bold' }}>
                        {' '}✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsConfirmOpen(true)}
            style={{ width: '100%', padding: 'var(--space-3)' }}
          >
            Submit test
          </button>
        </div>
      </div>

      {/* Confirmation Dialog on Manual Submit */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Submit Test"
        message={
          unansweredCount === 0
            ? 'You have answered all questions. Are you sure you want to submit your test?'
            : `You have ${unansweredCount} unanswered question${
                unansweredCount === 1 ? '' : 's'
              }. Are you sure you want to submit?`
        }
        confirmLabel="Submit Test"
        cancelLabel="Keep Reviewing"
        onConfirm={handleFinalSubmit}
        onCancel={() => setIsConfirmOpen(false)}
        loading={isSubmitting}
      />
    </div>
  );
};

export default TakeTestPage;
