import React, { useState } from 'react';
import supabase from './Supabase';
import '../style/MakeSession.css'; // CSS 파일을 임포트합니다.
import { useNavigate } from 'react-router-dom';
import { sendSlackMessage } from '../utils/slack';

const ManageInstanceSession = () => {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState('');
  const [openningAt, setOpenningAt] = useState('');
  const [participants, setParticipants] = useState([{ name: '', member_type: 'Crew', secretNumber: '' }]);

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
    setParticipants([...participants, { name: '', member_type: 'Crew', secretNumber: '' }]);
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
        .schema('hirc')  
        .from('sessions')
        .insert([{ name: `벙) ${sessionName}`, openning_at: openningAt, is_standard: 0 }])
        .select();
      
      if (sessionError) throw sessionError;

      const sessionId = sessionData[0].id;

      // 3번: workout_members 테이블에 참여자 명단 저장
      const participantsData = participants.map((participant) => ({
        session_id: sessionId,
        name: participant.name,
        member_type: participant.member_type,
        secret_number: participant.secretNumber, // 추가된 필드
        status: "done"
      }));

      const { error: membersError } = await supabase
        .schema('hirc')  
        .from('workout_members')
        .insert(participantsData);

      if (membersError) throw membersError;

      alert('러닝 세션이 성공적으로 생성되었습니다!');
      // Slack 메시지 전송
      await sendSlackMessage(`⚡️ [벙 세션 생성]\n러닝명: ${sessionName}\n일시: ${openningAt}\n참여자 수: ${participants.length}`);
    } catch (error) {
      console.error(error);
      alert('세션 생성 중 오류가 발생했습니다.');
    }
    navigate('/Done')
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>러닝명(벙):</label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>러닝 일시 : </label>
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
              <input
                type="text"
                name="secretNumber"
                placeholder="휴대전화 뒷 4자리"
                value={participant.secretNumber}
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
        <button type="button" className="add-participant-button" onClick={handleAddParticipant}>참여자 추가</button>
        <button type="submit" className="submit-button">세션 생성</button>
      </div>
    </form>
  );
};

export default ManageInstanceSession;