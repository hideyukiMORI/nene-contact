import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from '@/shared/ui/primitives/TextField';

const meta = {
  title: 'Primitives/TextField',
  component: TextField,
  args: { label: 'Email', placeholder: 'you@example.com' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: 'This field is required.' },
};
