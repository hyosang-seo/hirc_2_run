import React, { useEffect, useState } from 'react';
import supabase from './Supabase';
import '../style/CrewAttendance.css';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CrewAttendance = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const janFirst = new Date(now.getFullYear(), 0, 1);
    return formatDate(janFirst);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [memberType, setMemberType] = useState('Crew');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const setFirstHalf = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 5, 30);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const setSecondHalf = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 6, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    setStartDate(formatDate(start));
    setEndDate(formatDate(now));
  };

  const fetchAttendance = async () => {
    setLoading(true);
    // crew_members 전체 조회
    const { data: members, error: memberError } = await supabase
      .from('crew_members')
      .select('name, phone_back_number');
    if (memberError) {
      setAttendance([]);
      setLoading(false);
      return;
    }
    // phone_back_number만 추출 (문자열로 통일)
    const phoneNumbers = members
      .map(m => (m.phone_back_number != null ? String(m.phone_back_number) : null))
      .filter(v => v !== null && v.trim() !== '');
    if (!phoneNumbers.length) {
      setAttendance([]);
      setLoading(false);
      return;
    }
    // sessions.opening_at 기준으로 필터링하기 위해 조인
    let query = supabase
      .from('workout_members')
      .select('secret_number, sessions!inner(openning_at)', { head: false })
      .eq('member_type', memberType)
      .eq('status', 'done')
      .in('secret_number', phoneNumbers);
    if (startDate) query = query.gte('sessions.openning_at', startDate);
    if (endDate) {
      // 종료일을 하루 끝까지 포함하려면 다음날 00:00 미만으로 필터
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const endLt = formatDate(nextDay);
      query = query.lt('sessions.openning_at', endLt);
    }
    const { data: attendanceData, error: attError } = await query;
    // secret_number별 카운트 맵
    const countMap = {};
    if (!attError && Array.isArray(attendanceData)) {
      attendanceData.forEach(row => {
        const key = row.secret_number != null ? String(row.secret_number) : '';
        if (!key) return;
        countMap[key] = (countMap[key] || 0) + 1;
      });
    }
    // 결과 조합
    // 동일 phone_back_number 멤버가 여러 명일 수 있어 dedupe 후 표시
    const uniqueByPhone = Object.values(
      members.reduce((acc, m) => {
        const key = m.phone_back_number != null ? String(m.phone_back_number) : '';
        if (!key) return acc;
        if (!acc[key]) acc[key] = m; // 첫 번째만 유지
        return acc;
      }, {})
    );

    const result = uniqueByPhone.map(m => {
      const key = m.phone_back_number != null ? String(m.phone_back_number) : '';
      return {
        secret_number: key,
        name: m.name,
        count: countMap[key] ?? 0,
      };
    });
    setAttendance(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [memberType]);

  return (
    <div className="crew-attendance-container">
      <h2>크루 출석현황</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="attendance-button" onClick={setFirstHalf}>상반기</button>
        <button className="attendance-button" onClick={setSecondHalf}>하반기</button>
        <button className="attendance-button" onClick={setThisYear}>올해</button>
      </div>
      <div className="attendance-filters">
        <label>
          시작일:
          <input className="attendance-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label>
          종료일:
          <input className="attendance-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>
        <label>
          타입:
          <select className="attendance-select" value={memberType} onChange={e => setMemberType(e.target.value)}>
            <option value="Crew">Crew</option>
            <option value="Guest">Guest</option>
          </select>
        </label>
        <button className="attendance-button" onClick={fetchAttendance}>조회</button>
      </div>
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>휴대폰 뒷자리</th>
              <th>이름</th>
              <th>출석 카운트</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3}>로딩 중...</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan={3}>데이터 없음</td></tr>
            ) : (
              attendance.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.secret_number}</td>
                  <td>{row.name}</td>
                  <td>{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrewAttendance; 