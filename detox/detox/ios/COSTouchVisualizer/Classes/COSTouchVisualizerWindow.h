//
//  COSTouchVisualizerWindow.h
//  TouchVisualizer
//
//  Created by Joe Blau on 3/22/14.
//  Copyright (c) 2014 conopsys. All rights reserved.
//
#include <UIKit/UIKit.h>

@protocol COSTouchVisualizerWindowDelegate;

@interface COSTouchVisualizerWindow : UIWindow

@property (nonatomic, readonly, getter=isActive) BOOL active;
@property (nonatomic, weak) id<COSTouchVisualizerWindowDelegate> touchVisualizerWindowDelegate;

// Touch effects
@property (nonatomic) UIImage *touchImage;
@property (nonatomic) CGFloat touchAlpha;
@property (nonatomic) NSTimeInterval fadeDuration;
@property (nonatomic) UIColor *strokeColor;
@property (nonatomic) UIColor *fillColor;

// Ripple Effects
@property (nonatomic) UIImage *rippleImage;
@property (nonatomic) CGFloat rippleAlpha;
@property (nonatomic) NSTimeInterval rippleFadeDuration;
@property (nonatomic) UIColor *rippleStrokeColor;
@property (nonatomic) UIColor *rippleFillColor;

@property (nonatomic) BOOL stationaryMorphEnabled; // default: YES

@end

@protocol COSTouchVisualizerWindowDelegate <NSObject>

@optional

- (BOOL)touchVisualizerWindowShouldShowFingertip:(COSTouchVisualizerWindow *)window;
- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window;

@end
