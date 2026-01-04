import React, { useEffect, useState } from 'react';
import supabase from './Supabase'
import '../style/MemberList.css'; // CSS 파일 임포트

const MemberList = ({ status, sessionUuid }) => {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('workout_members')
        .select(`name, member_type,
          sessions (
            id,
            uuid
          )
        `)
        .eq('sessions.uuid', sessionUuid)
        .not('sessions', 'is', null)
        .eq('status', status)
        ;
      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(data);
      }
    };

    fetchMembers();
  }, [status, sessionUuid]);

  return (
    <div className={`member-list ${status}`}>
      <h3>{status === 'ready' ? '대기' : '완료'} {members.length} 명</h3>
      <ol>
        {members.map((member, index) => (
          <li key={index}>{member.name} ({member.member_type})</li>
        ))}
      </ol>
    </div>
  );
};

export default MemberList;
