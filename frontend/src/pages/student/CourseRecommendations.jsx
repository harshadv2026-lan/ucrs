import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import {
  Sparkles, BookOpen, AlertTriangle, CheckCircle2, ChevronRight,
  TrendingUp, RefreshCw, Layers, Cpu, Shield, Database,
  Globe, Cloud, Binary, Award, Clock, Users, Check, X,
  FileCode2, Network, ArrowRight
} from 'lucide-react'

// Topic icon map
const TOPIC_ICONS = {
  'Brain': Cpu,
  'Cloud': Cloud,
  'Globe': Globe,
  'Shield': Shield,
  'Database': Database,
  'Cpu': Cpu,
  'Layers': Layers,
  'HardDrive': Cpu,
  'Binary': Binary
}

export default function CourseRecommendations() {
  const { user } = useAuth()
  const studentRegNo = user?.regNo || user?.id || '2021CS001'

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [registeringId, setRegisteringId] = useState(null)
  const [data, setData] = useState(null)
  const [topics, setTopics] = useState([])
  const [selectedInterests, setSelectedInterests] = useState([])
  const [activeTab, setActiveTab] = useState('eligible') // 'eligible' | 'ineligible' | 'graph'
  const [ineligibleFilter, setIneligibleFilter] = useState('ALL') // 'ALL' | 'UNMET_PREREQUISITES' | 'ALREADY_COMPLETED' | 'ALREADY_ENROLLED'
  const [alert, setAlert] = useState(null)

  // Fetch topics list once
  useEffect(() => {
    apiService.recommendations.getTopics()
      .then(res => {
        if (res.data?.data) {
          setTopics(res.data.data)
        }
      })
      .catch(err => {
        console.error('Failed to load topic catalog:', err)
      })
  }, [])

  // Fetch recommendations with active interests
  const loadRecommendations = useCallback(async (interestsToUse) => {
    setLoading(true)
    try {
      const params = {}
      if (interestsToUse && interestsToUse.length > 0) {
        params.interests = interestsToUse
      }
      const res = await apiService.recommendations.getForStudent(studentRegNo, params)
      const recData = res.data?.data
      setData(recData)
      if (recData?.selectedInterests && (!interestsToUse || interestsToUse.length === 0)) {
        setSelectedInterests(recData.selectedInterests)
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load course recommendations'
      })
    } finally {
      setLoading(false)
    }
  }, [studentRegNo])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  // Handle interest chip toggle
  const toggleInterest = (topicName) => {
    let updated
    if (selectedInterests.includes(topicName)) {
      updated = selectedInterests.filter(t => t !== topicName)
    } else {
      updated = [...selectedInterests, topicName]
    }
    setSelectedInterests(updated)
    loadRecommendations(updated)
  }

  // Reset to default
  const resetInterests = () => {
    setSelectedInterests([])
    loadRecommendations([])
  }

  // Handle sync graph
  const handleSyncGraph = async () => {
    setSyncing(true)
    try {
      const res = await apiService.recommendations.syncGraph()
      setAlert({
        type: 'success',
        message: 'Neo4j graph synchronized successfully from relational database!'
      })
      loadRecommendations(selectedInterests)
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to sync graph'
      })
    } finally {
      setSyncing(false)
    }
  }

  // Quick Register from recommendation
  const handleQuickRegister = async (offeringId, courseId) => {
    setRegisteringId(offeringId)
    try {
      await apiService.registrations.register({
        studentRegNo,
        offeringId
      })
      setAlert({
        type: 'success',
        message: `Successfully registered for course ${courseId}! Neo4j recommendations and credit limits updated.`
      })
      // Refresh recommendations to reflect new registration immediately
      await loadRecommendations(selectedInterests)
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to register for course ${courseId}`
      setAlert({ type: 'error', message: msg })
    } finally {
      setRegisteringId(null)
    }
  }

  if (loading && !data) {
    return <LoadingSpinner message="Querying Neo4j graph and computing course recommendations..." />
  }

  const recommendations = data?.recommendations || []
  const ineligibleCourses = data?.ineligibleCourses || []
  const graphStats = data?.graphStats || {}
  const cypherQueries = data?.cypherQueries || []

  // Filter ineligible courses
  const filteredIneligible = ineligibleCourses.filter(c => {
    if (ineligibleFilter === 'ALL') return true
    return c.reasonCode === ineligibleFilter
  })

  // Credit math
  const maxCredits = data?.maxSemesterCredits || 20
  const currentCredits = data?.currentSemesterCredits || 0
  const remainingCredits = data?.remainingCredits ?? (maxCredits - currentCredits)
  const creditPercent = Math.min(100, Math.round((currentCredits / maxCredits) * 100))

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Page Header ── */}
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--forest-green), var(--emerald-deep))',
              color: 'var(--warm-gold)',
              boxShadow: '0 4px 10px rgba(33, 134, 91, 0.25)'
            }}>
              <Sparkles size={20} />
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Neo4j Course Recommendations</h1>
          </div>
          <p style={{ color: 'var(--gray-600)', marginTop: 6, fontSize: 14 }}>
            Graph-driven course matchmaking evaluating prerequisites, department curriculum, remaining credits, and your topic interests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--white)',
            border: '1px solid var(--gray-300)',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: graphStats.connected ? '#10b981' : 'var(--warm-gold)'
            }} />
            <span style={{ color: 'var(--gray-700)' }}>
              Engine: <strong style={{ color: 'var(--emerald-deep)' }}>
                {data?.graphEngineMode === 'LIVE_NEO4J' ? 'Live Neo4j' : 'Embedded Neo4j Engine'}
              </strong>
            </span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSyncGraph}
            disabled={syncing}
            title="Sync graph with H2 relational database"
          >
            <RefreshCw size={14} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing Graph...' : 'Sync Graph'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => loadRecommendations(selectedInterests)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {alert && (
        <AlertMessage
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ── Student Meta & Credit Capacity Meter ── */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'center' }}>
          {/* Student Profile Info */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              Advising Profile
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', marginTop: 2 }}>
              {data?.studentName || studentRegNo}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{studentRegNo}</span>
              <span className="badge badge-success" style={{ background: 'var(--forest-light)', color: 'var(--forest-green)', border: '1px solid var(--forest-border)' }}>
                {data?.departmentName || 'Computer Science'}
              </span>
              <span className="badge badge-warning" style={{ background: 'var(--warm-gold-light)', color: 'var(--warm-gold-text)', border: '1px solid var(--warm-gold-border)' }}>
                {data?.semesterName || 'Fall 2024'}
              </span>
            </div>
          </div>

          {/* Credit Allowance Progress */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                Semester Credit Load Capacity
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                <strong style={{ color: 'var(--emerald-deep)', fontSize: 15 }}>{currentCredits}</strong> of {maxCredits} credits registered
                <span style={{ marginLeft: 8, fontWeight: 600, color: remainingCredits > 0 ? 'var(--forest-green)' : 'var(--error)' }}>
                  ({remainingCredits} cr remaining)
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 10, backgroundColor: 'var(--gray-200)', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${creditPercent}%`,
                  height: '100%',
                  background: creditPercent > 80
                    ? 'linear-gradient(90deg, var(--forest-green), var(--warm-gold))'
                    : 'var(--forest-green)',
                  borderRadius: 5,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--gray-400)' }}>
              <span>0 cr</span>
              <span>10 cr (Typical Load)</span>
              <span>20 cr (Semester Limit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Topic Interest Selector ── */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--warm-gold)' }} />
              Customise Academic Topic Interests
            </h3>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2, margin: 0 }}>
              Toggle interest topics below. Neo4j graph traverses <code>(Course)-[:COVERS_TOPIC]-(Topic)</code> to boost relevant recommendations.
            </p>
          </div>
          <button
            onClick={resetInterests}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            Reset Defaults
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {topics.map(topic => {
            const isSelected = selectedInterests.includes(topic.name)
            const IconComponent = TOPIC_ICONS[topic.icon] || BookOpen
            return (
              <button
                key={topic.name}
                onClick={() => toggleInterest(topic.name)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  border: isSelected ? '1.5px solid var(--forest-green)' : '1px solid var(--gray-300)',
                  backgroundColor: isSelected ? 'var(--forest-light)' : 'var(--white)',
                  color: isSelected ? 'var(--forest-green)' : 'var(--gray-700)',
                  boxShadow: isSelected ? '0 2px 6px rgba(33, 134, 91, 0.15)' : 'none'
                }}
              >
                <IconComponent size={14} style={{ color: isSelected ? 'var(--forest-green)' : 'var(--gray-400)' }} />
                <span>{topic.name}</span>
                {isSelected && (
                  <span style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--forest-green)',
                    color: 'var(--white)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10
                  }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--gray-200)',
        marginBottom: 20,
        gap: 16
      }}>
        <button
          onClick={() => setActiveTab('eligible')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 14,
            fontWeight: activeTab === 'eligible' ? 700 : 500,
            color: activeTab === 'eligible' ? 'var(--forest-green)' : 'var(--gray-600)',
            borderBottom: activeTab === 'eligible' ? '3px solid var(--forest-green)' : '3px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Sparkles size={16} />
          Recommended Courses
          <span style={{
            background: activeTab === 'eligible' ? 'var(--forest-green)' : 'var(--gray-200)',
            color: activeTab === 'eligible' ? 'var(--white)' : 'var(--gray-700)',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700
          }}>
            {recommendations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ineligible')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 14,
            fontWeight: activeTab === 'ineligible' ? 700 : 500,
            color: activeTab === 'ineligible' ? 'var(--warm-gold-text)' : 'var(--gray-600)',
            borderBottom: activeTab === 'ineligible' ? '3px solid var(--warm-gold)' : '3px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <AlertTriangle size={16} />
          Ineligible & Blocked Courses
          <span style={{
            background: activeTab === 'ineligible' ? 'var(--warm-gold)' : 'var(--gray-200)',
            color: activeTab === 'ineligible' ? 'var(--white)' : 'var(--gray-700)',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700
          }}>
            {ineligibleCourses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 14,
            fontWeight: activeTab === 'graph' ? 700 : 500,
            color: activeTab === 'graph' ? 'var(--emerald-deep)' : 'var(--gray-600)',
            borderBottom: activeTab === 'graph' ? '3px solid var(--emerald-deep)' : '3px solid transparent',
            marginBottom: -2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Network size={16} />
          Neo4j Graph & Cypher Audit
        </button>
      </div>

      {/* ── TAB 1: ELIGIBLE RECOMMENDATIONS ── */}
      {activeTab === 'eligible' && (
        <div>
          {recommendations.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'var(--warm-gold-light)',
                color: 'var(--warm-gold-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>No Eligible Courses Found For Current Criteria</h3>
              <p style={{ color: 'var(--gray-600)', maxWidth: 500, margin: '8px auto 20px', fontSize: 13 }}>
                All course offerings in this semester are either already completed, currently enrolled, have unmet prerequisites, or exceed your {remainingCredits} remaining credits.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('ineligible')}
              >
                View Ineligible Courses & Requirements
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 20 }}>
              {recommendations.map((rec) => {
                const isExcellent = rec.matchScore >= 80
                const isHigh = rec.matchScore >= 60 && rec.matchScore < 80
                const scoreColor = isExcellent ? 'var(--warm-gold)' : isHigh ? 'var(--forest-green)' : 'var(--gray-700)'
                const scoreBg = isExcellent ? 'var(--warm-gold-light)' : isHigh ? 'var(--forest-light)' : 'var(--gray-100)'
                const scoreBorder = isExcellent ? 'var(--warm-gold-border)' : isHigh ? 'var(--forest-border)' : 'var(--gray-300)'

                return (
                  <div
                    key={rec.courseId}
                    className="card"
                    style={{
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: `4px solid ${scoreColor}`,
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top Bar with Match Score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: 'var(--white)',
                              background: 'var(--emerald-deep)',
                              padding: '2px 8px',
                              borderRadius: 6
                            }}>
                              {rec.courseId}
                            </span>
                            <span className="badge badge-info" style={{ fontWeight: 600 }}>
                              {rec.credits} Credits
                            </span>
                            {rec.homeDepartmentCore && (
                              <span className="badge badge-success" style={{ background: 'var(--forest-light)', color: 'var(--forest-green)', border: '1px solid var(--forest-border)' }}>
                                Major Core
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                            {rec.courseName}
                          </h3>
                          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
                            {rec.departmentName}
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div style={{
                          textAlign: 'center',
                          padding: '6px 14px',
                          background: scoreBg,
                          border: `1px solid ${scoreBorder}`,
                          borderRadius: 12
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                            {rec.matchScore}%
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: scoreColor, marginTop: 3 }}>
                            {rec.matchLevel} MATCH
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 13, color: 'var(--gray-700)', marginBottom: 14, lineHeight: 1.45 }}>
                        {rec.description}
                      </p>

                      {/* Offering Meta (Faculty, Schedule, Seats) */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        padding: 12,
                        background: 'var(--gray-50)',
                        borderRadius: 8,
                        fontSize: 12,
                        marginBottom: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} style={{ color: 'var(--gray-400)' }} />
                          <span style={{ color: 'var(--gray-700)' }}>
                            Faculty: <strong>{rec.facultyName}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} style={{ color: 'var(--gray-400)' }} />
                          <span style={{ color: 'var(--gray-700)' }}>
                            {rec.schedule || 'TBA'}
                          </span>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                          <span style={{ color: 'var(--gray-600)' }}>Seat Availability:</span>
                          <span style={{ fontWeight: 600, color: rec.availableSeats > 5 ? 'var(--forest-green)' : 'var(--warm-gold-text)' }}>
                            {rec.availableSeats} of {rec.maxSeats} seats available
                          </span>
                        </div>
                      </div>

                      {/* Why Recommended: Explainable AI bullet points */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald-deep)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={14} style={{ color: 'var(--warm-gold)' }} />
                          Why Recommended for You:
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rec.reasons.map((reason, idx) => (
                            <li key={idx} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 12,
                              color: 'var(--gray-700)',
                              lineHeight: 1.4
                            }}>
                              <CheckCircle2 size={14} style={{ color: 'var(--forest-green)', flexShrink: 0, marginTop: 2 }} />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Matched Topics Pills */}
                      {rec.matchedTopics && rec.matchedTopics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {rec.matchedTopics.map((t, i) => (
                            <span key={i} style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'var(--forest-light)',
                              color: 'var(--forest-green)',
                              border: '1px solid var(--forest-border)',
                              fontWeight: 500
                            }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Register Action */}
                    <div style={{ paddingTop: 14, borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        Credit cost: <strong>{rec.credits} cr</strong>
                      </span>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleQuickRegister(rec.offeringId, rec.courseId)}
                        disabled={registeringId === rec.offeringId || rec.availableSeats <= 0}
                        style={{ padding: '7px 16px', fontSize: 13 }}
                      >
                        {registeringId === rec.offeringId ? (
                          <>
                            <RefreshCw size={13} className="spinning" />
                            Registering...
                          </>
                        ) : rec.availableSeats <= 0 ? (
                          'Seats Full'
                        ) : (
                          <>
                            Quick Register <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: INELIGIBLE & BLOCKED COURSES ── */}
      {activeTab === 'ineligible' && (
        <div>
          {/* Subfilter Pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All Ineligible (${ineligibleCourses.length})` },
              { id: 'UNMET_PREREQUISITES', label: 'Missing Prerequisites' },
              { id: 'ALREADY_COMPLETED', label: 'Already Completed' },
              { id: 'ALREADY_ENROLLED', label: 'Currently Enrolled' },
              { id: 'EXCEEDS_CREDIT_LIMIT', label: 'Credit Limit Exceeded' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setIneligibleFilter(filter.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: ineligibleFilter === filter.id ? '1px solid var(--emerald-deep)' : '1px solid var(--gray-300)',
                  backgroundColor: ineligibleFilter === filter.id ? 'var(--emerald-deep)' : 'var(--white)',
                  color: ineligibleFilter === filter.id ? 'var(--white)' : 'var(--gray-700)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {filteredIneligible.map((item, idx) => {
              const isPrereq = item.reasonCode === 'UNMET_PREREQUISITES'
              const isEnrolled = item.reasonCode === 'ALREADY_ENROLLED'
              const isCompleted = item.reasonCode === 'ALREADY_COMPLETED'
              const isLimit = item.reasonCode === 'EXCEEDS_CREDIT_LIMIT'

              const borderClr = isPrereq ? 'var(--error)' : isLimit ? 'var(--warm-gold)' : 'var(--gray-400)'
              const badgeStyle = isPrereq
                ? { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }
                : isCompleted
                ? { background: 'var(--forest-light)', color: 'var(--forest-green)', border: '1px solid var(--forest-border)' }
                : isEnrolled
                ? { background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }
                : { background: 'var(--warm-gold-light)', color: 'var(--warm-gold-text)', border: '1px solid var(--warm-gold-border)' }

              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: 20,
                    borderLeft: `4px solid ${borderClr}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>
                            {item.courseId}
                          </span>
                          <span className="badge badge-info">{item.credits} Credits</span>
                          <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{item.departmentName}</span>
                        </div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                          {item.courseName}
                        </h4>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        ...badgeStyle
                      }}>
                        {item.reasonTitle}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--gray-700)', marginTop: 8, marginBottom: 12 }}>
                      {item.details}
                    </p>

                    {/* Unmet Prerequisites Warning Box */}
                    {isPrereq && item.unmetPrerequisites && item.unmetPrerequisites.length > 0 && (
                      <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 12
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: 4 }}>
                          Missing Prerequisite(s):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {item.unmetPrerequisites.map((p, pIdx) => (
                            <span key={pIdx} style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid #FCA5A5'
                            }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: 'var(--gray-600)',
                    paddingTop: 10,
                    borderTop: '1px solid var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <ChevronRight size={14} style={{ color: 'var(--gray-400)' }} />
                    <span><strong>Path to Eligibility:</strong> {item.canTakeWhen}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: NEO4J GRAPH ENGINE & CYPHER AUDIT ── */}
      {activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Engine Card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Network size={18} style={{ color: 'var(--forest-green)' }} />
              Neo4j Graph Database Topology
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Graph Engine Mode</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald-deep)', marginTop: 4 }}>
                  {data?.graphEngineMode}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  {graphStats.connected ? 'Connected via Bolt' : 'Embedded Graph Fallback'}
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Total Nodes</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--forest-green)', marginTop: 4 }}>
                  {graphStats.totalNodes || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  Courses, Students, Topics, Depts
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Total Relationships</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warm-gold-text)', marginTop: 4 }}>
                  {graphStats.totalRelationships || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  Prerequisites, Topics, Majors
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Prerequisite Edges</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginTop: 4 }}>
                  {graphStats.prerequisiteRelationships || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  REQUIRES_PREREQUISITE
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Topic Edges</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginTop: 4 }}>
                  {graphStats.topicRelationships || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                  COVERS_TOPIC
                </div>
              </div>
            </div>
          </div>

          {/* Cypher Statement Audit Log */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode2 size={16} style={{ color: 'var(--warm-gold)' }} />
                Executed Cypher Statements & Graph Queries
              </h3>
              <span className="badge badge-info">{cypherQueries.length} Queries Logged</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 12 }}>
              Neo4j Cypher statements executed to construct graph topology, traverse prerequisite chains, and match topic nodes.
            </p>

            <div style={{
              background: 'var(--emerald-dark)',
              color: '#A7F3D0',
              padding: 16,
              borderRadius: 8,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: 12,
              maxHeight: 340,
              overflowY: 'auto'
            }}>
              {cypherQueries.length === 0 ? (
                <span style={{ color: 'var(--gray-400)' }}>No queries executed yet.</span>
              ) : (
                cypherQueries.map((query, index) => (
                  <div key={index} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'var(--warm-gold)', marginRight: 8 }}>[{index + 1}]</span>
                    {query}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
