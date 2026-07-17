import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NewUserOnboarding from './NewUserOnboarding';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { growth: { submitAssessment: vi.fn() } } }));

describe('NewUserOnboarding', () => {
  it('yêu cầu trả lời tuần tự đủ 5 câu rồi lưu kết quả', async () => {
    const overview = { onboardingRequired: false, recommendedTrack: 'BEGINNER' } as any;
    vi.mocked(api.growth.submitAssessment).mockResolvedValue({ success: true, data: overview });
    const complete = vi.fn(); render(<NewUserOnboarding onComplete={complete} />);
    for (let index = 0; index < 5; index++) {
      fireEvent.click(screen.getByRole('button', { name: /^A/ }));
      fireEvent.click(screen.getByRole('button', { name: index === 4 ? /Xem lộ trình/ : /Tiếp tục/ }));
    }
    await waitFor(() => expect(api.growth.submitAssessment).toHaveBeenCalledWith([0, 0, 0, 0, 0]));
    expect(complete).toHaveBeenCalledWith(overview);
  });
});
