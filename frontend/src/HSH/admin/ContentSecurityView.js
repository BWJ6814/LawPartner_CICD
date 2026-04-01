import React from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { Card, Badge } from './AdminComponents';

export default function ContentSecurityView({
  contentBoards,
  handleToggleBlind,
  filters,
  setFilters,
  onSearch,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}) {
  return (
    <Card title="게시판 콘텐츠 보안 제어 (블라인드 관리)">
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">검색 (제목·글번호·작성자번호)</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="키워드 입력"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-bold text-slate-500 mb-1">상태</label>
          <select
            value={filters.blindYn}
            onChange={(e) => setFilters((f) => ({ ...f, blindYn: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">전체</option>
            <option value="N">정상만</option>
            <option value="Y">블라인드만</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">카테고리 (부분일치)</label>
          <input
            type="text"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="예: 형사범죄"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700"
        >
          <Search size={16} />
          검색
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        총 <span className="font-bold text-slate-700">{totalElements}</span>건
        {totalPages > 0 ? ` · 페이지 ${page + 1} / ${totalPages}` : ''}
        {pageSize ? ` · 페이지당 ${pageSize}건` : ''}
      </p>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-bold">게시글 번호</th>
              <th className="px-4 py-3 font-bold">제목</th>
              <th className="px-4 py-3 font-bold">카테고리</th>
              <th className="px-4 py-3 font-bold">작성자 번호</th>
              <th className="px-4 py-3 font-bold text-center">상태</th>
              <th className="px-4 py-3 font-bold text-center">제어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contentBoards.length > 0 ? contentBoards.map((board) => (
              <tr key={board.boardNo} className={`transition-colors ${board.blindYn === 'Y' ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                <td className="px-4 py-3 text-slate-500 font-mono">No.{board.boardNo}</td>
                <td className="px-4 py-3 font-bold text-slate-700 max-w-xs truncate">{board.title}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate text-xs" title={board.categoryCode}>{board.categoryCode || '—'}</td>
                <td className="px-4 py-3 text-blue-600 font-mono font-bold">User {board.writerNo}</td>
                <td className="px-4 py-3 text-center">
                  {board.blindYn === 'Y' ? (
                    <Badge variant="red">블라인드됨</Badge>
                  ) : (
                    <Badge variant="green">정상 게시</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleBlind(board.boardNo, board.blindYn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      board.blindYn === 'Y'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    }`}
                  >
                    {board.blindYn === 'Y' ? <><Eye size={14} /> 정상 복구</> : <><EyeOff size={14} /> 강제 블라인드</>}
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="py-10 text-center text-slate-400 font-bold">조회된 게시글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            이전
          </button>
          <span className="text-xs text-slate-600 font-bold px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            다음
          </button>
        </div>
      )}
    </Card>
  );
}
