import React, { useEffect, useState, useCallback } from 'react';
import supabase from './Supabase';
import '../style/Dashboard.css';

const Dashboard = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    
    // 현재 날짜 기준으로 상반기/하반기 판단
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // 상반기: 1-6월, 하반기: 7-12월
    const isFirstHalf = currentMonth <= 6;

    const startDate = isFirstHalf 
      ? `${currentYear}-01-01` 
      : `${currentYear}-07-01`;
    const endDate = isFirstHalf 
      ? `${currentYear}-06-30` 
      : `${currentYear}-12-31`;

    try {
      // 크루 멤버 조회
      const { data: crewMembers, error: memberError } = await supabase
        .from('crew_members')
        .select('id, name, phone_back_number, join_date');

      if (memberError) throw memberError;

      // 각 멤버별 출석 데이터 조회
      const membersWithAttendance = await Promise.all(
        crewMembers.map(async (member) => {
          if (!member.phone_back_number) return null;

          const { data: attendanceData, error: attendanceError } = await supabase
            .from('workout_members')
            .select(`
              secret_number,
              sessions!inner(openning_at)
            `)
            .eq('secret_number', member.phone_back_number)
            .eq('member_type', 'Crew')
            .eq('status', 'done')
            .gte('sessions.openning_at', startDate)
            .lte('sessions.openning_at', endDate);

          if (attendanceError) return null;

          const attendanceCount = attendanceData?.length || 0;
          const progress = Math.min((attendanceCount / 6) * 100, 100); // 6회 목표
          const badges = calculateBadges(attendanceCount, member.join_date);

          return {
            ...member,
            attendanceCount,
            progress,
            badges,
            phoneNumber: member.phone_back_number
          };
        })
      );

      // null 값 제거하고 출석 횟수 순으로 정렬
      const validMembers = membersWithAttendance
        .filter(member => member !== null)
        .sort((a, b) => b.attendanceCount - a.attendanceCount);

      setMembers(validMembers);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calculateBadges = (attendanceCount, joinDate) => {
    const badges = [];
    
    // 크루 스타 뱃지 (출석 3회 이상)
    if (attendanceCount >= 3) {
      badges.push({
        name: '크루 스타',
        icon: '🌟',
        description: '3회 이상 출석'
      });
    }

    // 목표 달성 뱃지 (출석 6회 이상)
    if (attendanceCount >= 6) {
      badges.push({
        name: '목표 달성',
        icon: '🏆',
        description: '상반기/하반기 목표 달성'
      });
      
      // 폭죽 축하 뱃지 (목표 달성 시)
      badges.push({
        name: '축하!',
        icon: '🎉',
        description: '목표 달성 축하!'
      });
    }

    // 신입 러너 뱃지 (현재 상반기/하반기에 가입한 멤버)
    if (joinDate) {
      const joinDateObj = new Date(joinDate);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // 상반기: 1-6월, 하반기: 7-12월
      const isFirstHalf = currentMonth <= 6;
      
      if (isFirstHalf) {
        // 현재가 상반기인 경우, 올해 상반기에 가입한 사람
        const firstHalfStart = new Date(currentYear, 0, 1); // 1월 1일
        const firstHalfEnd = new Date(currentYear, 5, 30); // 6월 30일
        
        if (joinDateObj >= firstHalfStart && joinDateObj <= firstHalfEnd) {
          badges.push({
            name: '신입 러너',
            icon: '🆕',
            description: '올해 상반기 신입 멤버'
          });
        }
      } else {
        // 현재가 하반기인 경우, 올해 하반기에 가입한 사람
        const secondHalfStart = new Date(currentYear, 6, 1); // 7월 1일
        const secondHalfEnd = new Date(currentYear, 11, 31); // 12월 31일
        
        if (joinDateObj >= secondHalfStart && joinDateObj <= secondHalfEnd) {
          badges.push({
            name: '신입 러너',
            icon: '🆕',
            description: '올해 하반기 신입 멤버'
          });
        }
      }
    }

    return badges;
  };

  const getPeriodText = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (currentMonth <= 6) {
      return `${currentYear}년 상반기`;
    } else {
      return `${currentYear}년 하반기`;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return '#4CAF50'; // 완료: 초록
    if (progress >= 80) return '#FF9800';  // 80% 이상: 주황
    if (progress >= 60) return '#2196F3';  // 60% 이상: 파랑
    if (progress >= 40) return '#FFC107';  // 40% 이상: 노랑
    return '#F44336'; // 40% 미만: 빨강
  };

  const getTopRunnersWithRanks = () => {
    if (members.length === 0) return [];
    
    // 출석 횟수별로 그룹화하여 상위 등수들 찾기
    const attendanceGroups = {};
    members.forEach(member => {
      const count = member.attendanceCount;
      if (!attendanceGroups[count]) {
        attendanceGroups[count] = [];
      }
      attendanceGroups[count].push(member);
    });
    
    // 출석 횟수 내림차순으로 정렬
    const sortedCounts = Object.keys(attendanceGroups).map(Number).sort((a, b) => b - a);
    
    const result = [];
    let currentRank = 1;
    
    // 상위 등수부터 처리
    for (const count of sortedCounts) {
      const membersWithSameCount = attendanceGroups[count];
      
      // 같은 등수의 멤버들을 모두 추가
      membersWithSameCount.forEach(member => {
        result.push({
          ...member,
          displayRank: currentRank
        });
      });
      
      // 다음 등수로 이동
      currentRank += membersWithSameCount.length;
      
      // 상위 3등까지만 표시 (공동등수 포함)
      if (result.length >= 3) {
        break;
      }
    }
    
    return result;
  };

  const getRankMedal = (displayRank) => {
    switch (displayRank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  // 전체 멤버의 등수를 계산하는 함수 추가
  const calculateRanks = (members) => {
    if (members.length === 0) return [];
    
    const result = [];
    let currentRank = 1;
    let currentAttendance = members[0]?.attendanceCount;
    
    members.forEach((member, index) => {
      if (member.attendanceCount !== currentAttendance) {
        currentRank = index + 1;
        currentAttendance = member.attendanceCount;
      }
      
      result.push({
        ...member,
        displayRank: currentRank
      });
    });
    
    return result;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  // 등수가 계산된 멤버 리스트
  const membersWithRanks = calculateRanks(members);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🏃‍♂️ 러닝 대시보드</h1>
        <div className="period-info">
          <h2>{getPeriodText()} 목표: 6회 출석</h2>
          <div className="header-stats">
            <span className="member-count">현재 {members.length}명의 크루 멤버</span>
            <span className="achievement-count">목표 달성: {members.filter(m => m.attendanceCount >= 6).length} / {members.length}</span>
          </div>
        </div>
      </div>

      {/* Top 3 러너 표시 */}
      {members.length > 0 && (
        <div className="top-runners">
          <h3>🏆 {getPeriodText()} Top 3 러너</h3>
          <div className="top-runners-grid">
            {getTopRunnersWithRanks().map((member, index) => (
              <div key={member.id} className={`top-runner-card rank-${member.displayRank}`}>
                <div className="rank-medal">
                  {getRankMedal(member.displayRank)}
                </div>
                <div className="top-runner-info">
                  <div className="top-runner-name">{member.name}</div>
                  <div className="top-runner-count">{member.attendanceCount}회 출석</div>
                  <div className="top-runner-progress">
                    <div className="mini-progress-bar">
                      <div 
                        className="mini-progress-fill"
                        style={{
                          width: `${member.progress}%`,
                          backgroundColor: getProgressColor(member.progress)
                        }}
                      ></div>
                    </div>
                    <span className="mini-progress-text">{Math.round(member.progress)}%</span>
                  </div>
                </div>
                <div className="top-runner-badges">
                  {member.badges.slice(0, 3).map((badge, badgeIndex) => (
                    <span key={badgeIndex} className="top-badge-icon" title={badge.description}>
                      {badge.icon}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="badge-legend">
        <h3>뱃지 설명</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="badge-icon">🌟</span>
            <span>크루 스타: 3회 이상 출석</span>
          </div>
          <div className="legend-item">
            <span className="badge-icon">🏆</span>
            <span>목표 달성: 6회 목표 달성</span>
          </div>
          <div className="legend-item">
            <span className="badge-icon">🎉</span>
            <span>축하!: 목표 달성 축하!</span>
          </div>
          <div className="legend-item">
            <span className="badge-icon">🆕</span>
            <span>신입 러너: 올해 상반기/하반기 신입 멤버</span>
          </div>
        </div>
      </div>

      <div className="members-list">
        {membersWithRanks.map((member, index) => (
          <div key={member.id} className="member-row">
            <div className="member-rank">#{member.displayRank}</div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-phone">뒷자리: {member.phoneNumber}</div>
            </div>
            <div className="progress-section">
              <div className="progress-info">
                <span className="attendance-count">{member.attendanceCount}회</span>
                <span className="progress-text">/ 6회</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar"
                  style={{
                    width: `${member.progress}%`,
                    backgroundColor: getProgressColor(member.progress)
                  }}
                ></div>
              </div>
              <div className="progress-percentage">{Math.round(member.progress)}%</div>
            </div>
            <div className="badges-section">
              <div className="badges-list">
                {member.badges.map((badge, badgeIndex) => (
                  <span key={badgeIndex} className="badge-icon" title={badge.description}>
                    {badge.icon}
                  </span>
                ))}
                {member.badges.length === 0 && (
                  <span className="no-badges">-</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-footer">
        <div className="dashboard-actions">
          <button className="dashboard-action-btn" onClick={() => window.location.reload()}>
            🔄 새로고침
          </button>
          <button className="dashboard-action-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ⬆️ 맨 위로
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
