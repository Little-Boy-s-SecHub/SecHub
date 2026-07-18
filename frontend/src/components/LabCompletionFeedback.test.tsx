import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LabCompletionFeedback from './LabCompletionFeedback';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));

const feedback = {
  vulnerabilityName: 'SQL Injection', summary: 'Đã khai thác truy vấn.', whyItWorked: 'Input bị nối chuỗi.',
  vulnerableCode: 'query + input', secureCode: 'prepare(query)', remediationSteps: ['Dùng tham số'],
  lessonTakeaway: 'Không nối input.', nextLabId: 'next-1', nextLabTitle: 'SQLi nâng cao', nextLabDifficulty: 'INTERMEDIATE',
};
const attempt = {
  id: 'a1', userId: 'u1', labId: 'l1', labTitle: 'SQLi cơ bản', status: 'COMPLETED' as const,
  startedAt: '2026-07-18T01:00:00', completedAt: '2026-07-18T01:20:00', extensionCount: 0, score: 90, hintsUsed: 1,
};

describe('LabCompletionFeedback', () => {
  beforeEach(() => { Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }, share: undefined }); });
  it('hiển thị số liệu thật và lab tiếp theo', () => {
    render(<LabCompletionFeedback feedback={feedback} attempt={attempt} onHarder={vi.fn()} creatingHarder={false} />);
    expect(screen.getByText('20 phút')).toBeInTheDocument(); expect(screen.getByText(/Kỹ năng đạt được/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lab tiếp theo: SQLi nâng cao/ })).toHaveAttribute('href', '/labs/next-1');
  });
  it('hiển thị nút quay lại bài học và liên kết lộ trình tùy chỉnh nếu truyền pathId và lessonId', () => {
    render(<LabCompletionFeedback feedback={feedback} attempt={attempt} onHarder={vi.fn()} creatingHarder={false} pathId="path-123" lessonId="lesson-456" />);
    expect(screen.getByRole('link', { name: /Quay lại bài học/ })).toHaveAttribute('href', '/learning/path-123/lessons/lesson-456');
    expect(screen.getByRole('link', { name: /Tiếp tục lộ trình/ })).toHaveAttribute('href', '/learning/path-123');
    expect(screen.getByRole('link', { name: /Lab tiếp theo: SQLi nâng cao/ })).toHaveAttribute('href', '/labs/next-1?pathId=path-123&lessonId=lesson-456');
  });
  it('tạo bản chia sẻ không chứa flag hoặc payload', async () => {
    render(<LabCompletionFeedback feedback={feedback} attempt={{ ...attempt, flagSubmitted: 'SecHub{secret}' }} onHarder={vi.fn()} creatingHarder={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Chia sẻ kết quả/ }));
    const shared = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(shared).toContain('90 XP'); expect(shared).not.toContain('SecHub{secret}'); expect(shared).not.toContain('payload');
  });
});
