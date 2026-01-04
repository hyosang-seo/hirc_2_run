// ManageSessionMember.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "./Supabase";
import '../style/ManageSessionMember.css'; // CSS 파일을 임포트합니다.


const ManageSessionMember = () => {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const sessionId = queryParams.get("sessionId");
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("Guest");

  const handleCancelMember = async () => {
      // Step 1: Select the first matching record where status is 'ready'
      const { data: selectData, error: selectError } = await supabase
      .from('workout_members')
      .select('id')  // Assuming `id` is the unique identifier
      .match({ name: name, member_type: type, session_id: sessionId, status: 'ready' })
      .limit(1);

      if (selectError) {
      console.error('Error fetching member:', selectError);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
      return;
      }

      if (selectData.length === 0) {
      alert('해당하는 데이터가 없습니다.');
      return;
      }

      const memberId = selectData[0].id;

    try {
      const { error } = await supabase
        .from("workout_members")
        .update({ status: 'cancel'})
        .eq('id', memberId)
        .select('*', { count: 'exact' });

      if (error) {
        console.error("Error adding member:", error);
        return;
      }

      alert("회원이 성공적으로 추가되었습니다.");
      setName(""); // 입력 필드를 초기화
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };


  const handleAddMember = async () => {
    try {
      const { error } = await supabase.from("workout_members").insert([
        {
          name,
          member_type: type,
          session_id: sessionId,
        },
      ]);

      if (error) {
        console.error("Error adding member:", error);
        return;
      }

      alert("회원이 성공적으로 추가되었습니다.");
      setName(""); // 입력 필드를 초기화
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleRemoveMember = async () => {
    try {
      const { error } = await supabase
        .from("workout_members")
        .delete()
        .eq("session_id", sessionId)
        .eq("name", name)
        .eq("member_type", type);

      if (error) {
        console.error("Error removing member:", error);
        return;
      }

      alert("회원이 성공적으로 제거되었습니다.");
      setName(""); // 입력 필드를 초기화
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <div className="manage-session-member">
      <h3>회원 추가 / 제거 / 당일취소</h3>
      <div>
        <label htmlFor="member-name">회원 이름:</label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>회원 타입:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="Crew"
              checked={type === "Crew"}
              onChange={(e) => setType(e.target.value)}
            />
            Crew
          </label>
          <label>
            <input
              type="radio"
              value="Guest"
              checked={type === "Guest"}
              onChange={(e) => setType(e.target.value)}
            />
            Guest
          </label>
        </div>
      </div>
      <div className="button-group">
        <button className="button-cancel" onClick={handleCancelMember}>당일 취소</button>
        <button onClick={handleAddMember}>회원 추가</button>
        <button onClick={handleRemoveMember}>회원 제거</button>
      </div>
      <button className="button-back" onClick={() => navigate(-1)}>뒤로가기</button>
    </div>
  );
};

export default ManageSessionMember;
