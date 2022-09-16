import { css } from 'lit'

export const sharedStyles = css`

  h1, h2, h3, p, figure {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h2 {
    margin: 0;
    padding: 0;
    font-size: 1.7rem;
    font-weight: 200;
    color: var(--text1);
  }

  .dark {
    background-color: var(--text1);
    color: var(--surface1);
  }

  .light {
    background-color: var(--surface1);
    color: var(--text1);
  }

  /* clear default button style */
  button {
    border: none;
    background: none;
    color: inherit;
    outline: inherit;
    line-height: 0;
    
    cursor: pointer;
  }

  .btn-default {
    border: 2px solid var(--brand);
  }

  .btn-default:hover {
    color: whitesmoke;
    background-color: var(--brand);
  }

  button:disabled {
    color: whitesmoke;
    background-color: #333;
  }

  button:hover:disabled {
    color: whitesmoke;
    background-color: #333;
  }

  button {
    margin: 1rem;
    padding: 3rem;
    font-size: 1.7rem;
    background-color: var(--brand);
  }

  /* inputs */
  input[type=text] {
    padding: 1rem;
    width: 100%;
    font-size: 2.7rem;
    border: none;
    border-bottom: 2px solid var(--brand);
  }

  input:invalid {
    border-bottom: 2px solid var(--custom-red);
  }
  
  svg {
    display: inline-block;
    outline: none;
  }

  /* ---------------------------- Mobile media ----------------------------- */
  @media (max-width: 640px) {

  }
`