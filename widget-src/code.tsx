import { Button } from './components/Button'

const { widget } = figma
const { Frame } = widget

function Widget() {
  return (
    <Frame width={100} height={100} fill={'#C4C4C4'}>
      <Button onClick={() => console.log('Clicked')}>Button</Button>
    </Frame>
  )
}

widget.register(Widget)
