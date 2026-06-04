import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from '@/shared/ui/primitives/Alert';

const meta = {
  title: 'Primitives/Alert',
  component: Alert,
  args: { children: 'Something went wrong.' },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {};
