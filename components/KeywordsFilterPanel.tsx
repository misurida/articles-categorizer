import { Text, Box, Group, Input, Select, Slider, Stack, createStyles } from "@mantine/core";
import { useDatabase } from "../hooks/useDatabase";
import { useEffect, useMemo, useState } from "react";

const useStyles = createStyles((theme) => ({
  sliderBox: {
    minWidth: "min(300px, 80vw)"
  },
  countBox: {
    display: "flex",
    gap: 10,
    flexDirection: "column"
  }
}));

export default function KeywordsFilterPanel() {

  const { freqThreshold, setFreqThreshold, freqThresholdGT, setFreqThresholdGT, wordsFrequencies } = useDatabase()
  const [localValue, setLocalValue] = useState(0)
  const { classes } = useStyles()

  useEffect(() => {
    setLocalValue(freqThreshold)
  }, [freqThreshold])

  const sliderMarks = useMemo(() => {
    const o: number[] = []
    for (let i = 0; i < wordsFrequencies.length; i++) {
      const f = wordsFrequencies[i]
      if (!o.includes(f.count)) {
        o.push(f.count)
      }
    }
    o.sort((a,b) => a-b)
    return o
  }, [wordsFrequencies])

  return (
    <Stack>
      <Box className={classes.sliderBox}>
        <Input.Wrapper label="Count threshold">
          <div className={classes.countBox}>
            <Select
              sx={{ width: 130 }}
              value={freqThresholdGT ? '1' : ''}
              onChange={v => setFreqThresholdGT(!!v)}
              data={[
                { value: '1', label: 'Greater than' },
                { value: '', label: 'Lower than' }
              ]}
            />
            <Group>
              <Slider
                mt={5}
                min={0}
                max={sliderMarks.length > 0 ? sliderMarks[sliderMarks.length - 1] : 100}
                sx={{ flex: 1, width: "100%" }}
                label={e => e}
                value={localValue}
                onChange={setLocalValue}
                onChangeEnd={setFreqThreshold}
              />
              <Text sx={{width: 20}} size="sm">{localValue}</Text>
            </Group>
          </div>
        </Input.Wrapper>
      </Box>
    </Stack>
  )
}