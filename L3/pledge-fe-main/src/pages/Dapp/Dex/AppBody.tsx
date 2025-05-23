import React from 'react';
import styled from 'styled-components';
import { Card } from '@pancakeswap-libs/uikit';

export const BodyWrapper = styled(Card)`
  position: relative;
  border-radius: 20px;
`;
// .hLlXtp
/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper>{children}</BodyWrapper>;
}
