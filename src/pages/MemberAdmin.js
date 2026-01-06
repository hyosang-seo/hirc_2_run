import React, { useCallback, useEffect, useState } from 'react';
import supabase from './Supabase';
import { sendSlackMessage } from '../utils/slack';
import '../style/MemberAdmin.css';

const initialMember = {
  name: '',
  gender: '',
  join_date: '',
  instagram: '',
  hometown: '',
  address: '',
  workplace: '',
  job: '',
  phone_back_number: ''
};

// id 필드가 없는 안전한 초기값 생성 함수
const createSafeInitialMember = () => ({
  name: '',
  gender: '',
  join_date: '',
  instagram: '',
  hometown: '',
  address: '',
  workplace: '',
  job: '',
  phone_back_number: ''
});

const MemberAdmin = () => {
  const [members, setMembers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editMember, setEditMember] = useState(initialMember);
  const [newMember, setNewMember] = useState(createSafeInitialMember());
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // 화면 크기 상태 추가
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const fetchMembers = useCallback(async () => {
    console.log('fetchMembers 호출됨');
    let query = supabase.schema('hirc').from('crew_members').select('*').order('id', { ascending: true });
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query;
    if (!error) {
      setMembers(data);
      fetchAttendanceCounts(data); // memberIds 대신 members 전체를 넘김
      setCurrentPage(1); // 검색 시 첫 페이지로 이동
    } else {
      console.error('회원 목록 조회 오류:', error);
    }
  }, [search]);

  // 출석 현황(각 회원별 workout_members에서 status가 'done'인 횟수)
  const fetchAttendanceCounts = async (members) => {
    // phone_back_number가 있는 회원만 추출
    const validNumbers = (members || [])
      .map(m => m.phone_back_number)
      .filter(num => typeof num === 'number' && !isNaN(num));
    if (!validNumbers.length) {
      setAttendanceMap({});
      return;
    }

    const { data, error } = await supabase
      .schema('hirc')  
      .from('workout_members')
      .select('secret_number')
      .eq('member_type', 'Crew')
      .eq('status', 'done')
      .in('secret_number', validNumbers);

    if (!error) {
      // secret_number별 done 상태 카운트
      const map = {};
      validNumbers.forEach(num => { map[num] = 0; });
      data.forEach(row => {
        map[row.secret_number] = (map[row.secret_number] || 0) + 1;
      });
      setAttendanceMap(map);
    }
  };

  // 회원 추가
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name) return alert('이름을 입력하세요.');
    
    // 휴대폰 뒷자리 유효성 검사
    if (newMember.phone_back_number) {
      const phoneNum = parseInt(newMember.phone_back_number);
      if (isNaN(phoneNum) || phoneNum < 0 || phoneNum > 32767) {
        alert('휴대폰 뒷자리는 0-32767 사이의 숫자여야 합니다.');
        return;
      }
      
      // 중복 확인
      const { data: existingMembers } = await supabase
        .schema('hirc')  
        .from('crew_members')
        .select('id, name, phone_back_number')
        .eq('phone_back_number', phoneNum);
      
      if (existingMembers && existingMembers.length > 0) {
        alert(`이미 존재하는 휴대폰 뒷자리입니다: ${existingMembers[0].name} (${existingMembers[0].phone_back_number})`);
        return;
      }
    }
    
    try {
      // id 필드를 제외한 데이터만 추출
      const { id, ...memberData } = newMember;
      
      const insertData = {
        name: memberData.name,
        gender: memberData.gender,
        join_date: memberData.join_date || null,
        instagram: memberData.instagram,
        hometown: memberData.hometown,
        address: memberData.address,
        workplace: memberData.workplace,
        job: memberData.job,
        phone_back_number: memberData.phone_back_number ? parseInt(memberData.phone_back_number) : null
      };
      
      console.log('삽입할 데이터:', insertData);
      
      const { error } = await supabase
        .schema('hirc')  
        .from('crew_members')
        .insert([insertData]);
      
      if (error) {
        console.error('회원 추가 오류:', error);
        
        let errorMessage = '';
        if (error.code === '23505') {
          errorMessage = '이미 존재하는 휴대폰 뒷자리입니다. 다른 번호를 사용해주세요.';
        } else if (error.code === '23514') {
          errorMessage = '입력된 데이터가 제약조건을 만족하지 않습니다. 다시 확인해주세요.';
        } else if (error.code === '42501') {
          errorMessage = '권한이 없습니다. 관리자에게 문의하세요.';
        } else {
          errorMessage = `회원 추가 중 오류가 발생했습니다.\n\n오류 코드: ${error.code}\n오류 메시지: ${error.message}`;
        }
        
        // Slack에 에러 메시지 전송
        try {
          const slackErrorMessage = `❌ 회원 추가 실패\n이름: ${insertData.name}\n오류 코드: ${error.code}\n오류 메시지: ${error.message}\n상세 정보: ${error.details || '없음'}`;
          await sendSlackMessage(slackErrorMessage);
        } catch (slackError) {
          console.error('Slack 에러 메시지 전송 실패:', slackError);
        }
        
        alert(errorMessage);
        return;
      }
      
      setNewMember(createSafeInitialMember());
      fetchMembers();
      
      // Slack 메시지 전송
      try {
        const slackMessage = `🆕 새 회원 등록\n이름: ${insertData.name}\n성별: ${insertData.gender || '미입력'}\n휴대폰 뒷자리: ${insertData.phone_back_number || '미입력'}\n입회날짜: ${insertData.join_date || '미입력'}`;
        await sendSlackMessage(slackMessage);
      } catch (slackError) {
        console.error('Slack 메시지 전송 실패:', slackError);
      }
      
      alert('회원이 성공적으로 추가되었습니다.');
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      alert('회원 추가 중 예상치 못한 오류가 발생했습니다.');
    }
  };

  // 회원 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    // 삭제 전 회원 정보 조회
    const { data: memberToDelete } = await supabase
      .schema('hirc')  
      .from('crew_members')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase.schema('hirc').from('crew_members').delete().eq('id', id);
    if (!error) {
      fetchMembers();
      
      // Slack 메시지 전송
      try {
        const slackMessage = `🗑️ 회원 삭제\n이름: ${memberToDelete?.name || '알 수 없음'}\n성별: ${memberToDelete?.gender || '미입력'}\n휴대폰 뒷자리: ${memberToDelete?.phone_back_number || '미입력'}`;
        await sendSlackMessage(slackMessage);
      } catch (slackError) {
        console.error('Slack 메시지 전송 실패:', slackError);
      }
    } else {
      // Slack에 에러 메시지 전송
      try {
        const slackErrorMessage = `❌ 회원 삭제 실패\n회원 ID: ${id}\n이름: ${memberToDelete?.name || '알 수 없음'}\n오류 코드: ${error.code}\n오류 메시지: ${error.message}`;
        await sendSlackMessage(slackErrorMessage);
      } catch (slackError) {
        console.error('Slack 에러 메시지 전송 실패:', slackError);
      }
      
      console.error('회원 삭제 오류:', error);
      alert(`회원 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 회원 수정 모드 진입
  const handleEdit = (member) => {
    setEditId(member.id);
    setEditMember({ ...member, join_date: member.join_date ? member.join_date.substring(0, 10) : '' });
  };

  // 회원 정보 수정
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    console.log('수정 입력:', name, value);
    setEditMember((prev) => {
      const updated = { ...prev, [name]: value };
      console.log('수정된 editMember:', updated);
      return updated;
    });
  };

  // 회원 정보 저장
  const handleEditSave = async (memberId) => {
    try {
      // id 필드를 제외한 데이터만 추출
      const { id, ...memberData } = editMember;
      
      const updateData = {
        name: memberData.name,
        gender: memberData.gender,
        join_date: memberData.join_date || null,
        instagram: memberData.instagram,
        hometown: memberData.hometown,
        address: memberData.address,
        workplace: memberData.workplace,
        job: memberData.job,
        phone_back_number: memberData.phone_back_number ? parseInt(memberData.phone_back_number) : null
      };
      
      console.log('수정할 데이터:', updateData);
      console.log('수정할 회원 ID:', memberId);
      console.log('editMember 원본:', editMember);
      
      const { error } = await supabase.schema('hirc').from('crew_members').update(updateData).eq('id', memberId);
      
      console.log('업데이트 오류:', error);
      
      // 업데이트 후 해당 회원 데이터 직접 조회
      const { data: updatedMember, error: fetchError } = await supabase
        .schema('hirc')  
        .from('crew_members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      console.log('업데이트된 회원 데이터:', updatedMember, fetchError);
      
      if (error) {
        console.error('회원 수정 오류:', error);
        
        let errorMessage = '';
        if (error.code === '23505') {
          errorMessage = '이미 존재하는 휴대폰 뒷자리입니다. 다른 번호를 사용해주세요.';
        } else if (error.code === '23514') {
          errorMessage = '입력된 데이터가 제약조건을 만족하지 않습니다. 다시 확인해주세요.';
        } else if (error.code === '42501') {
          errorMessage = '권한이 없습니다. 관리자에게 문의하세요.';
        } else {
          errorMessage = `회원 수정 중 오류가 발생했습니다.\n\n오류 코드: ${error.code}\n오류 메시지: ${error.message}`;
        }
        
        // Slack에 에러 메시지 전송
        try {
          const slackErrorMessage = `❌ 회원 수정 실패\n이름: ${updateData.name}\n회원 ID: ${memberId}\n오류 코드: ${error.code}\n오류 메시지: ${error.message}\n상세 정보: ${error.details || '없음'}`;
          await sendSlackMessage(slackErrorMessage);
        } catch (slackError) {
          console.error('Slack 에러 메시지 전송 실패:', slackError);
        }
        
        alert(errorMessage);
        return;
      }
      
      setEditId(null);
      
      // 업데이트된 데이터로 화면 즉시 갱신
      if (updatedMember) {
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === memberId ? updatedMember : member
          )
        );
      } else {
        // 백업: 전체 데이터 새로고침
        fetchMembers();
      }
      
      // Slack 메시지 전송
      try {
        const slackMessage = `✏️ 회원 정보 수정\n이름: ${updateData.name}\n성별: ${updateData.gender || '미입력'}\n휴대폰 뒷자리: ${updateData.phone_back_number || '미입력'}\n입회날짜: ${updateData.join_date || '미입력'}`;
        await sendSlackMessage(slackMessage);
      } catch (slackError) {
        console.error('Slack 메시지 전송 실패:', slackError);
      }
      
      alert('회원 정보가 성공적으로 수정되었습니다.');
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      alert('회원 수정 중 예상치 못한 오류가 발생했습니다.');
    }
  };

  // 검색/필터
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = members.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(members.length / itemsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 화면 크기에 따른 컨테이너 스타일 계산
  const getContainerStyle = () => {
    const maxWidth = Math.min(screenWidth - 20, 1200); // 최대 1200px, 최소 20px 여백
    const margin = Math.max(10, (screenWidth - maxWidth) / 2); // 중앙 정렬을 위한 마진
    
    if (screenWidth <= 480) {
      return {
        maxWidth: `${maxWidth}px`,
        margin: `${10}px ${margin}px`,
        padding: '15px 10px',
        fontSize: '10px'
      };
    } else if (screenWidth <= 768) {
      return {
        maxWidth: `${maxWidth}px`,
        margin: `${15}px ${margin}px`,
        padding: '20px 15px',
        fontSize: '11px'
      };
    } else if (screenWidth <= 1024) {
      return {
        maxWidth: `${maxWidth}px`,
        margin: `${20}px ${margin}px`,
        padding: '25px 20px',
        fontSize: '13px'
      };
    } else {
      return {
        maxWidth: `${maxWidth}px`,
        margin: `${20}px ${margin}px`,
        padding: '30px',
        fontSize: '14px'
      };
    }
  };

  // 화면 크기에 따른 폼 그리드 계산
  const getFormGridStyle = () => {
    if (screenWidth <= 360) {
      return {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
        padding: '8px'
      };
    } else if (screenWidth <= 480) {
      return {
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        padding: '10px'
      };
    } else if (screenWidth <= 768) {
      return {
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        padding: '12px'
      };
    } else {
      return {
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        padding: '25px'
      };
    }
  };

  // 화면 크기에 따른 테이블 스타일 계산
  const getTableStyle = () => {
    if (screenWidth <= 480) {
      return {
        width: '100%',
        fontSize: '10px'
      };
    } else if (screenWidth <= 768) {
      return {
        width: '100%',
        fontSize: '11px'
      };
    } else if (screenWidth <= 1024) {
      return {
        width: '100%',
        fontSize: '13px'
      };
    } else {
      return {
        width: '100%',
        fontSize: '14px'
      };
    }
  };

  const containerStyle = getContainerStyle();
  const formGridStyle = getFormGridStyle();
  const tableStyle = getTableStyle();

  return (
    <div className="member-admin-container" style={containerStyle}>
      <h2>정규회원 관리</h2>
      <form className="member-admin-form" onSubmit={handleAddMember} style={formGridStyle}>
        <input className="member-admin-input" type="text" placeholder="이름" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} required />
        <select className="member-admin-input" value={newMember.gender} onChange={e => setNewMember({ ...newMember, gender: e.target.value })}>
          <option value="">성별</option>
          <option value="남">남</option>
          <option value="여">여</option>
        </select>
        <input className="member-admin-input" type="date" placeholder="입회날짜" value={newMember.join_date} onChange={e => setNewMember({ ...newMember, join_date: e.target.value })} />
        <input className="member-admin-input" type="text" placeholder="인스타 계정" value={newMember.instagram} onChange={e => setNewMember({ ...newMember, instagram: e.target.value })} />
        <input className="member-admin-input" type="text" placeholder="고향(-시)" value={newMember.hometown} onChange={e => setNewMember({ ...newMember, hometown: e.target.value })} />
        <input className="member-admin-input" type="text" placeholder="거주지(00구 00동)" value={newMember.address} onChange={e => setNewMember({ ...newMember, address: e.target.value })} />
        <input className="member-admin-input" type="text" placeholder="직장(-구)" value={newMember.workplace} onChange={e => setNewMember({ ...newMember, workplace: e.target.value })} />
        <input className="member-admin-input" type="text" placeholder="직업(직종)" value={newMember.job} onChange={e => setNewMember({ ...newMember, job: e.target.value })} />
        <input className="member-admin-input" type="number" placeholder="휴대폰 뒷자리" value={newMember.phone_back_number} onChange={e => setNewMember({ ...newMember, phone_back_number: e.target.value })} />
        <button className="member-admin-add-btn" type="submit">회원 추가</button>
      </form>
      <input type="text" placeholder="이름 검색" value={search} onChange={handleSearch} className="member-search-input" />
      
      <div className="table-container">
        <table className="member-admin-table" style={tableStyle}>
          <thead>
            <tr>
              <th>이름</th>
              <th>성별</th>
              <th>입회날짜</th>
              <th>인스타</th>
              <th>고향</th>
              <th>거주지</th>
              <th>직장</th>
              <th>직업</th>
              <th>휴대폰 뒷자리</th>
              <th>출석횟수</th>
              <th>수정/삭제</th>
            </tr>
          </thead>
          <tbody>
            {currentMembers.map(member => (
              <tr key={member.id}>
                {editId === member.id ? (
                  <>
                    <td><input name="name" value={editMember.name} onChange={handleEditChange} /></td>
                    <td>
                      <select name="gender" value={editMember.gender} onChange={handleEditChange}>
                        <option value="">성별</option>
                        <option value="남">남</option>
                        <option value="여">여</option>
                      </select>
                    </td>
                    <td><input name="join_date" type="date" value={editMember.join_date || ''} onChange={handleEditChange} /></td>
                    <td><input name="instagram" value={editMember.instagram || ''} onChange={handleEditChange} /></td>
                    <td><input name="hometown" value={editMember.hometown || ''} onChange={handleEditChange} /></td>
                    <td><input name="address" value={editMember.address || ''} onChange={handleEditChange} /></td>
                    <td><input name="workplace" value={editMember.workplace || ''} onChange={handleEditChange} /></td>
                    <td><input name="job" value={editMember.job || ''} onChange={handleEditChange} /></td>
                    <td><input name="phone_back_number" type="number" value={editMember.phone_back_number || ''} onChange={handleEditChange} /></td>
                    <td>{attendanceMap[member.phone_back_number] || 0}</td>
                    <td>
                      <button className="save-btn" onClick={() => handleEditSave(member.id)}>저장</button>
                      <button className="cancel-btn" onClick={() => setEditId(null)}>취소</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{member.name}</td>
                    <td>{member.gender}</td>
                    <td>{member.join_date ? member.join_date.substring(0, 10) : ''}</td>
                    <td>{member.instagram}</td>
                    <td>{member.hometown}</td>
                    <td>{member.address}</td>
                    <td>{member.workplace}</td>
                    <td>{member.job}</td>
                    <td>{member.phone_back_number}</td>
                    <td>{attendanceMap[member.phone_back_number] || 0}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(member)}>수정</button>
                      <button className="delete-btn" onClick={() => handleDelete(member.id)}>삭제</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            이전
          </button>
          <span className="pagination-info">
            {currentPage} / {totalPages} 페이지
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberAdmin; 