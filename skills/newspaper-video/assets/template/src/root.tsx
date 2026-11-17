import React from 'react';
import {Composition} from 'remotion';
import {NewspaperShort, type FilmProps} from './template';
import data from './timeline.json';
export const Root:React.FC=()=> <Composition id="NewspaperShort" component={NewspaperShort} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={data as FilmProps} calculateMetadata={({props})=>({durationInFrames:Math.max(1,...props.scenes.map(s=>s.end))})}/>;
