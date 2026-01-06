import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCodeComponent from "./QRCodeComponent";
import MemberList from "./MemberList";
import supabase from "./Supabase";
import '../style/QRPage.css'; // CSS 파일을 임포트합니다.

const QRPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const uuid = queryParams.get("uuid");
  const sessionId = queryParams.get("sessionId");
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!uuid) {
    return <div>UUID가 없습니다. 페이지를 새로고침하거나 다시 시도하세요.</div>;
  }

  // 종료처리 함수
  const handleCloseSession = async () => {
    try {
      // sessions 테이블에서 해당 세션을 종료 처리
      const { error: sessionError } = await supabase
        .schema('hirc')  
        .from("sessions")
        .update({ 
          closing_at: new Date().toISOString(),
         }) // 현재 시간으로 업데이트
        .eq("uuid", uuid);

      if (sessionError) {
        console.error("Error updating session:", sessionError);
        return;
      }

      // workmembers 테이블에서 해당 세션의 ready 상태인 멤버들을 noshow로 업데이트
      const { data: memberData, error: memberError } = await supabase
        .schema('hirc')
        .from("workout_members")
        .update({ status: "noshow" })
        .eq("session_id", sessionId)
        .eq("status", "ready");

      if (memberError) {
        console.error("Error updating workmembers:", memberError);
        return;
      }

      console.log("Updated members to noshow:", memberData);

      // 성공적으로 종료처리가 완료되면 페이지를 새로고침하거나, 사용자에게 알림을 표시할 수 있습니다.
      navigate("/Done");
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleManageMembers = () => {
    navigate(`/ManageSessionMember?sessionId=${sessionId}`);
  };
  

  return (
    <div className="qr-container">
      <div className="qr-code-section">
        <h3>QR 코드</h3>

        {/* <h4>url : </h4> */}
        {/* <h4>{currentDomain}/infoPage?sessionId={encodeURIComponent(sessionId)}&uuid={encodeURIComponent(uuid)}</h4> */}

        <QRCodeComponent uuid={uuid} sessionId={sessionId} />
      </div>
      <div className="actions">
      <button onClick={handleRefresh}>새로고침</button>

      </div>
      <div className="member-list-section">
        <h3>회원 목록</h3>
        <div className="member-columns">
          <MemberList status="ready" sessionUuid={uuid} />
          <MemberList status="done" sessionUuid={uuid} />
        </div>
        <div className="actions">
          <button onClick={handleManageMembers}>참여관리</button>
          <button onClick={handleCloseSession}>출석종료 <br></br>러닝시작</button>
          <button onClick={() => navigate(-1)}>뒤로가기</button>

        </div>
      </div>
    </div>
  );
};

export default QRPage;
