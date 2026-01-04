import React, { useState } from 'react';
import supabase from './Supabase';
import '../style/MakeSession.css'; // CSS 파일을 임포트합니다.
import { useNavigate } from 'react-router-dom';
import { sendSlackMessage } from '../utils/slack';

const MakeSession = () => {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState('');
  const [openningAt, setOpenningAt] = useState('');
  const [participants, setParticipants] = useState([{ name: '', member_type: 'Crew' }]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  
  const handleParticipantChange = (index, event) => {
    const values = [...participants];
    const { name, value, type } = event.target;

    if (type === 'radio') {
      values[index].member_type = value === 'hirc' ? 'Crew' : 'Guest';
    } else {
      values[index][name] = value;
    }

    setParticipants(values);
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', member_type: 'Crew' }]);
  };

  const handleRemoveParticipant = (index) => {
    const values = [...participants];
    values.splice(index, 1);
    setParticipants(values);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1, 2번: sessions 테이블에 러닝명과 일시 저장
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ name: sessionName, openning_at: openningAt, is_standard: 1, is_confirmed: 1}])
        .select()
        ;
      
      if (sessionError) throw sessionError;

      const sessionId = sessionData[0].id;

      // 3번: workout_members 테이블에 참여자 명단 저장
      const participantsData = participants.map((participant) => ({
        session_id: sessionId,
        name: participant.name,
        member_type: participant.member_type,
      }));

      const { error: membersError } = await supabase
        .from('workout_members')
        .insert(participantsData);

      if (membersError) throw membersError;

      alert('러닝 세션이 성공적으로 생성되었습니다!');
      // Slack 메시지 전송
      await sendSlackMessage(`🟢 [정규 세션 생성]\n러닝명: ${sessionName}\n일시: ${openningAt}\n참여자 수: ${participants.length}`);
    } catch (error) {
      console.error(error);
      alert('세션 생성 중 오류가 발생했습니다.');
    }

    navigate('/');
  };


  const handleLogin = (e) => {
    e.preventDefault();
    // Simple authentication check
    if (userId === 'seoulrunner' && password === 'seoulrunner') {
      setIsAuthenticated(true);
    } else {
      alert('인증에 실패했습니다. ID와 비밀번호를 확인하세요.');
    }
  };


  if (!isAuthenticated) {
    return (
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button">
          로그인
        </button>
      </form>
    );
  }


const naviToconfirm = (e) => {
  navigate('/runningConfirm');

  };

  return (
    <form onSubmit={handleSubmit}>
      <button onClick={naviToconfirm}>벙 session 확인하기</button>

      <div className="form-group">
        <label>러닝명:</label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>러닝 일시:</label>
        <input
          type="datetime-local"
          value={openningAt}
          onChange={(e) => setOpenningAt(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>참여자 명단:</label>
        {participants.map((participant, index) => (
          <div key={index} className="participant-row">
            <div className="participant-header">
              <input
                type="text"
                name="name"
                placeholder="이름"
                value={participant.name}
                onChange={(e) => handleParticipantChange(index, e)}
                required
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => handleRemoveParticipant(index)}
              >
                X
              </button>
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name={`member_type_${index}`}  /* 유니크한 name 속성 */
                  value="hirc"
                  checked={participant.member_type === 'Crew'}
                  onChange={(e) => handleParticipantChange(index, e)}
                />
                hirc
              </label>
              <label>
                <input
                  type="radio"
                  name={`member_type_${index}`}  /* 유니크한 name 속성 */
                  value="게스트"
                  checked={participant.member_type === 'Guest'}
                  onChange={(e) => handleParticipantChange(index, e)}
                />
                게스트
              </label>
            </div>
          </div>
        ))}
        <button type="button" className="add-participant-button" onClick={handleAddParticipant}>
          참여자 추가
        </button>
      <button type="submit" className="submit-button">
        세션 생성
      </button>
      </div>
    </form>
  );
};

export default MakeSession;
