// QRCodeComponent.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../style/InfoPage.css'; // CSS 파일 임포트
import supabase from './Supabase'
import { sendSlackMessage } from '../utils/slack';

const InfoPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  const queryParams = new URLSearchParams(search);
  const uuid = queryParams.get('uuid');
  const sessionId = queryParams.get('sessionId');

  const [name, setName] = useState('');
  const [secretNumber, setSecretNumber] = useState('');
  const [memberType, setMemberType] = useState('Guest'); // 기본값은 guest
  const [sessionName, setSessionName] = useState(''); // 세션 이름 상태 추가

  // 세션 정보를 가져오는 useEffect 추가
  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (!sessionId) return;
      
      try {
        const { data, error } = await supabase
          .schema('hirc')
          .from('sessions')
          .select('name')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error('Error fetching session:', error);
          
          // Slack에 세션 조회 에러 메시지 전송
          try {
            const slackErrorMessage = `❌ [세션 조회] 실패\n세션 ID: ${sessionId}\n오류 코드: ${error.code}\n오류 메시지: ${error.message}`;
            await sendSlackMessage(slackErrorMessage);
          } catch (slackError) {
            console.error('Slack 에러 메시지 전송 실패:', slackError);
          }
        } else if (data) {
          setSessionName(data.name);
        }
      } catch (err) {
        console.error('Unexpected error fetching session:', err);
        
        // Slack에 예기치 않은 세션 조회 에러 메시지 전송
        try {
          const slackErrorMessage = `💥 [세션 조회] 예기치 않은 오류\n세션 ID: ${sessionId}\n오류: ${err.message || err}`;
          await sendSlackMessage(slackErrorMessage);
        } catch (slackError) {
          console.error('Slack 에러 메시지 전송 실패:', slackError);
        }
      }
    };

    fetchSessionInfo();
  }, [sessionId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') setName(value);
    if (name === 'secretNumber') setSecretNumber(value);
    if (name === 'memberType') setMemberType(value);
  };

  const handleCheckIn = async () => {
    if (!name || !secretNumber || !uuid) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    const numericSecretNumber = parseInt(secretNumber, 10); 
    // member_type과 상태를 업데이트

    try {
      // Step 1: Select the first matching record where status is 'ready'
      console.log(name)
      console.log(memberType)
      console.log(sessionId)
      const { data: selectData, error: selectError } = await supabase
        .schema('hirc')  
        .from('workout_members')
        .select('id')  // Assuming `id` is the unique identifier
        .match({ name: name, member_type: memberType, session_id: sessionId, status: 'ready' })
        .limit(1);
      
      if (selectError) {
        console.error('Error fetching member:', selectError);
        
        // Slack에 에러 메시지 전송
        try {
          const slackErrorMessage = `❌ [출석 체크] 데이터 조회 실패\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}\n오류 코드: ${selectError.code}\n오류 메시지: ${selectError.message}`;
          await sendSlackMessage(slackErrorMessage);
        } catch (slackError) {
          console.error('Slack 에러 메시지 전송 실패:', slackError);
        }
        
        alert('데이터를 가져오는 중 오류가 발생했습니다.');
        return;
      }
  
      if (selectData.length === 0) {
        // Slack에 데이터 없음 메시지 전송
        try {
          const slackErrorMessage = `⚠️ [출석 체크] 데이터 없음\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}\n상태: ready인 데이터가 없음`;
          await sendSlackMessage(slackErrorMessage);
        } catch (slackError) {
          console.error('Slack 에러 메시지 전송 실패:', slackError);
        }
        
        alert('해당하는 데이터가 없습니다.');
        return;
      }
  

    const { data, error } = await supabase
    .schema('hirc')
    .from('workout_members')
    .update({ status: 'done', secret_number: numericSecretNumber })
    .match({ name: name, member_type: memberType, session_id: sessionId })
    .select('*', { count: 'exact' });
      ;
    if (error) {
      console.error('Error updating member:', error);
      
      // Slack에 에러 메시지 전송
      try {
        const slackErrorMessage = `❌ [출석 체크] 업데이트 실패\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}\n오류 코드: ${error.code}\n오류 메시지: ${error.message}`;
        await sendSlackMessage(slackErrorMessage);
      } catch (slackError) {
        console.error('Slack 에러 메시지 전송 실패:', slackError);
      }
      
      alert('출석 체크 중 오류가 발생했습니다.');
    } else if (data.length === 0) {
      // 업데이트된 데이터가 없는 경우
      
      // Slack에 데이터 없음 메시지 전송
      try {
        const slackErrorMessage = `⚠️ [출석 체크] 업데이트할 데이터 없음\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}`;
        await sendSlackMessage(slackErrorMessage);
      } catch (slackError) {
        console.error('Slack 에러 메시지 전송 실패:', slackError);
      }
      
      alert('해당하는 데이터가 없습니다.');
    } else {
      console.log('Member updated successfully:', data);
      alert('출석 체크가 완료되었습니다.');
      // Slack 메시지 전송
      await sendSlackMessage(`✅ [출석 체크]\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}\n시간: ${new Date().toLocaleString('ko-KR')}`);
      // navigate('/Done')
      navigate('/Done', { state: { name, secretNumber } });
      // 여기서 페이지 이동 또는 상태 변경을 할 수 있습니다.
    }
    } catch (err) {
      console.error('Unexpected error:', err);
      
      // Slack에 예기치 않은 오류 메시지 전송
      try {
        const slackErrorMessage = `💥 [출석 체크] 예기치 않은 오류\n이름: ${name}\n타입: ${memberType}\n세션: ${sessionName || sessionId}\n오류: ${err.message || err}`;
        await sendSlackMessage(slackErrorMessage);
      } catch (slackError) {
        console.error('Slack 에러 메시지 전송 실패:', slackError);
      }
      
      alert('예기치 않은 오류가 발생했습니다.');
    }
  };

  return (
    <div className="check-in-container">
      <h1>출석 체크</h1>
      {sessionName && (
        <div className="session-info">
          <h2>{sessionName}</h2>
        </div>
      )}
      <form>
        <div>
          <label>
            이름:
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            휴대전화 뒷 4자리:
            <input
              type="text"
              name="secretNumber"
              value={secretNumber}
              onChange={handleInputChange}
              required
              maxLength="4"
            />
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="memberType"
              value="Crew"
              checked={memberType === 'Crew'}
              onChange={handleInputChange}
            />
            HIRC
          </label>
          <label>
            <input
              type="radio"
              name="memberType"
              value="Guest"
              checked={memberType === 'Guest'}
              onChange={handleInputChange}
            />
            게스트
          </label>
        </div>
        <button type="button" onClick={handleCheckIn}>
          출첵
        </button>
      </form>
    </div>
  );
};

export default InfoPage;
