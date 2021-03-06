/**
Copyright (c) 2014 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./chrome_process_helper.js");

'use strict';

/**
 * @fileoverview Utilities for accessing trace data about the Chrome browser.
 */
global.tr.exportTo('tr.e.audits', function() {
  function ChromeBrowserHelper(modelHelper, process) {
    tr.e.audits.ChromeProcessHelper.call(this, modelHelper, process);
    this.mainThread_ = process.findAtMostOneThreadNamed('CrBrowserMain');
  }

  ChromeBrowserHelper.isBrowserProcess = function(process) {
    return !!process.findAtMostOneThreadNamed('CrBrowserMain');
  };

  ChromeBrowserHelper.prototype = {
    __proto__: tr.e.audits.ChromeProcessHelper.prototype,

    get rendererHelpers() {
      return this.modelHelper.rendererHelpers;
    },

    getLoadingEventsInRange: function(rangeOfInterest) {
      return this.getAllAsyncSlicesMatching(function(slice) {
        return slice.title.indexOf('WebContentsImpl Loading') === 0 &&
            rangeOfInterest.intersectsExplicitRangeInclusive(
                slice.start, slice.end);
      });
    },

    getCommitProvisionalLoadEventsInRange: function(rangeOfInterest) {
      return this.getAllAsyncSlicesMatching(function(slice) {
        return slice.title === 'RenderFrameImpl::didCommitProvisionalLoad' &&
            rangeOfInterest.intersectsExplicitRangeInclusive(
                slice.start, slice.end);
      });
    },

    get hasLatencyEvents() {
      var hasLatency = false;
      this.modelHelper.model.getAllThreads().some(function(thread) {
        thread.iterateAllEvents(function(event) {
          if (!event.isTopLevel)
            return;
          if (!(event instanceof tr.e.cc.InputLatencyAsyncSlice))
            return;
          hasLatency = true;
        });
        return hasLatency;
      });
      return hasLatency;
    },

    getLatencyEventsInRange: function(rangeOfInterest) {
      return this.getAllAsyncSlicesMatching(function(slice) {
        return (slice.title.indexOf('InputLatency') === 0) &&
            rangeOfInterest.intersectsExplicitRangeInclusive(
                slice.start, slice.end);
      });
    },

    getAllAsyncSlicesMatching: function(pred, opt_this) {
      var events = [];
      this.iterAllThreads(function(thread) {
        thread.iterateAllEvents(function(slice) {
          if (pred.call(opt_this, slice))
            events.push(slice);
        });
      });
      return events;
    },

    getAllNetworkEventsInRange: function(rangeOfInterest) {
      var networkEvents = [];
      this.modelHelper.model.getAllThreads().forEach(function(thread) {
        thread.asyncSliceGroup.slices.forEach(function(slice) {
          var match = false;
          if (slice.category == 'net' ||  // old-style URLRequest/Resource
              slice.category == 'disabled-by-default-netlog' ||
              slice.category == 'netlog') {
            match = true;
          }

          if (!match)
            return;

          if (rangeOfInterest.intersectsExplicitRangeInclusive(
                slice.start, slice.end))
            networkEvents.push(slice);
        });
      });
      return networkEvents;
    },

    iterAllThreads: function(func, opt_this) {
      tr.b.iterItems(this.process.threads, function(tid, thread) {
        func.call(opt_this, thread);
      });

      tr.b.iterItems(this.rendererHelpers, function(pid, rendererHelper) {
        var rendererProcess = rendererHelper.process;
        tr.b.iterItems(rendererProcess.threads, function(tid, thread) {
          func.call(opt_this, thread);
        });
      }, this);
    }
  };

  return {
    ChromeBrowserHelper: ChromeBrowserHelper
  };
});
