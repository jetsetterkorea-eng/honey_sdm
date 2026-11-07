
      document.addEventListener("DOMContentLoaded", () => {
        const REGION_PRICING = {
          "발리": { "bundleStart": 398 },
          "하와이": { "bundleStart": 398 },
          "몰디브": { "bundleStart": 778 },
          "시드니": { "bundleStart": 398, "defaultHotel": "상담 시 안내" },
          "코사무이": { "bundleStart": 338, "defaultHotel": "상담 시 안내" },
          "모리셔스": { "bundleStart": 598, "defaultHotel": "상담 시 안내" }
        };

        // Source: proposal 1, 22 studios / 26 plans, individual contract starts in KRW 10,000.
        const STUDIO_CATALOG = {
  "원세컨드": {
    "start": 66,
    "note": "헤어·메이크업 미포함",
    "plans": [
      {
        "id": "won2a",
        "name": "원세컨드A",
        "start": 66
      },
      {
        "id": "won2b",
        "name": "원세컨드B",
        "start": 88
      },
      {
        "id": "won2c",
        "name": "원세컨드C",
        "start": 110
      }
    ]
  },
  "메이스튜디오": {
    "start": 88,
    "note": "",
    "plans": [
      {
        "id": "mae",
        "name": "메이스튜디오",
        "start": 88
      }
    ]
  },
  "로렌하우스": {
    "start": 88,
    "note": "",
    "plans": [
      {
        "id": "lauren",
        "name": "로렌하우스",
        "start": 88
      }
    ]
  },
  "로맨틱에비뉴": {
    "start": 88,
    "note": "",
    "plans": [
      {
        "id": "romantic",
        "name": "로맨틱에비뉴",
        "start": 88
      }
    ]
  },
  "봉": {
    "start": 88,
    "note": "",
    "plans": [
      {
        "id": "bong",
        "name": "봉",
        "start": 88
      }
    ]
  },
  "ST정우": {
    "start": 88,
    "note": "",
    "plans": [
      {
        "id": "stjungwoo",
        "name": "ST정우",
        "start": 88
      }
    ]
  },
  "이포토에세이": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "ephoto",
        "name": "이포토에세이",
        "start": 110
      }
    ]
  },
  "온뜰에 피움": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "ontteul",
        "name": "온뜰에 피움",
        "start": 110
      }
    ]
  },
  "로이": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "roi",
        "name": "로이",
        "start": 110
      }
    ]
  },
  "용마메리미": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "yongma_am",
        "name": "용마메리미(오전)",
        "start": 110
      },
      {
        "id": "yongma_pm",
        "name": "용마메리미(오후)",
        "start": 132
      }
    ]
  },
  "헤로하우스": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "hero",
        "name": "헤로하우스",
        "start": 110
      }
    ]
  },
  "구호": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "guho",
        "name": "구호",
        "start": 110
      }
    ]
  },
  "실버문": {
    "start": 110,
    "note": "",
    "plans": [
      {
        "id": "silver",
        "name": "실버문",
        "start": 110
      }
    ]
  },
  "가을": {
    "start": 121,
    "note": "",
    "plans": [
      {
        "id": "gaeul",
        "name": "가을",
        "start": 121
      }
    ]
  },
  "뷰시엘": {
    "start": 132,
    "note": "",
    "plans": [
      {
        "id": "vueciel",
        "name": "뷰시엘",
        "start": 132
      }
    ]
  },
  "탱자": {
    "start": 132,
    "note": "",
    "plans": [
      {
        "id": "taengja",
        "name": "탱자",
        "start": 132
      }
    ]
  },
  "보다연희재": {
    "start": 132,
    "note": "",
    "plans": [
      {
        "id": "yeonhui",
        "name": "보다연희재",
        "start": 132
      }
    ]
  },
  "라흐": {
    "start": 132,
    "note": "",
    "plans": [
      {
        "id": "rah",
        "name": "라흐",
        "start": 132
      }
    ]
  },
  "라흐디메이드": {
    "start": 132,
    "note": "",
    "plans": [
      {
        "id": "rah_di",
        "name": "라흐디메이드",
        "start": 132
      }
    ]
  },
  "더브라이드": {
    "start": 154,
    "note": "",
    "plans": [
      {
        "id": "thebride",
        "name": "더브라이드",
        "start": 154
      }
    ]
  },
  "원규": {
    "start": 154,
    "note": "",
    "plans": [
      {
        "id": "wongyu_first",
        "name": "원규(첫타임)",
        "start": 154
      },
      {
        "id": "wongyu",
        "name": "원규(그 외)",
        "start": 176
      }
    ]
  },
  "에스S": {
    "start": 154,
    "note": "",
    "plans": [
      {
        "id": "sS",
        "name": "에스S",
        "start": 154
      }
    ]
  }
};
        const STUDIO_NAMES = Array.from(document.querySelectorAll('input[name="journey-studio"]'))
          .map(input => input.value).filter(name => name !== 'custom' && name !== '아직 미정');

        let selectedHotel = null;
        const selectedExtras = new Set();
        let extrasDecisionMade = false;
        let budgetAdvanceUsed = false;

        const journeyPanels = [
          document.getElementById("journey-panel-0"),
          document.getElementById("journey-panel-1"),
          document.getElementById("journey-panel-2"),
          document.getElementById("journey-panel-3")
        ];
        function goToQuestion(index, moveFocus = false) {
          const panel = journeyPanels[index];
          panel.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
          if (moveFocus) panel.querySelector('h3').focus({preventScroll: true});
        }
        function scrollBehavior() {
          return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
        }
        function revealNextQuestion(index) {
          const heading = journeyPanels[index]?.querySelector('h3');
          if (!heading) return;
          const bounds = heading.getBoundingClientRect();
          const headerBottom = document.querySelector('.section-nav').getBoundingClientRect().bottom;
          const dockTop = document.querySelector('.honeys-black-dock').getBoundingClientRect().top;
          if (bounds.top >= headerBottom + 12 && bounds.bottom <= dockTop - 16) return;
          goToQuestion(index);
        }

        const hotelDisclosures = Array.from(document.querySelectorAll(".destination-details"));
        const hotelRows = Array.from(document.querySelectorAll(".destination-hotels dl > div"));
        function expandSelectedHotels(region) {
          hotelDisclosures.forEach(details => {
            details.open = details.closest('.destination-choice').querySelector('input[name="journey-region"]').value === region;
          });
          reflectHotelDisclosureLabels();
        }
        hotelDisclosures.forEach((details) => {
          details.open = false;
          details.querySelector("summary")?.addEventListener("click", (event) => {
            event.preventDefault();
            const shouldOpen = !details.open;
            hotelDisclosures.forEach((other) => { other.open = false; });
            details.open = shouldOpen;
          });
          details.addEventListener("toggle", () => {
            if (details.open) hotelDisclosures.forEach((other) => {
              if (other !== details) other.open = false;
            });
            reflectHotelDisclosureLabels();
          });
        });

        function reflectHotelDisclosureLabels() {
          hotelDisclosures.forEach((details) => {
            const region = details.closest(".destination-choice")?.querySelector('input[name="journey-region"]');
            const label = details.querySelector("summary > span:first-child");
            if (!label) return;
            label.textContent = details.open
              ? "숙소별 2인 시작가 · 웨딩촬영 포함"
              : region?.checked && selectedHotel
                ? `선택한 숙소 · ${selectedHotel.name}`
                : "숙소·가격 선택";
          });
        }

        function reflectSelectedHotel() {
          hotelRows.forEach((row) => {
            const card = row.closest(".destination-choice");
            const region = card?.querySelector('input[name="journey-region"]');
            const isSelected = Boolean(region?.checked && selectedHotel?.name === row.querySelector("dt")?.textContent.trim());
            row.classList.toggle("is-selected-hotel", isSelected);
            row.setAttribute("aria-pressed", String(isSelected));
          });
          reflectHotelDisclosureLabels();
        }

        hotelRows.forEach((hotelRow) => {
          const name = hotelRow.querySelector("dt")?.textContent.trim() || "숙소";
          const price = hotelRow.querySelector("dd b")?.textContent.trim() || "";
          hotelRow.setAttribute("role", "button");
          hotelRow.setAttribute("tabindex", "0");
          hotelRow.setAttribute("aria-pressed", "false");
          hotelRow.setAttribute("aria-label", `${name}, 2인 ${price}만원부터, 이 숙소 선택`);
          const selectionMark = document.createElement("span");
          selectionMark.className = "hotel-choice-check";
          selectionMark.setAttribute("aria-hidden", "true");
          hotelRow.querySelector("dd")?.append(selectionMark);
          hotelRow.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              hotelRow.click();
            }
          });
          hotelRow.addEventListener("click", () => {
            const card = hotelRow.closest(".destination-choice");
            if (!card) return;
            const radio = card.querySelector('input[name="journey-region"]');
            if (!radio) return;
            const couplePrice = Number(price);
            selectDestination(radio.value, {
              region: radio.value,
              name,
              bundleStart: couplePrice > 0 ? couplePrice : null
            });
          });
        });

        const quoteRegionText = document.getElementById("quote-region-text");
        const quoteStudioText = document.getElementById("studio-selection-text");
        const quoteBudgetText = document.getElementById("quote-budget-text");

        const hiddenRegion = document.getElementById("region-value");
        const hiddenStudio = document.getElementById("studio-name");
        const hiddenBudget = document.getElementById("budget");

        const customStudioInput = document.getElementById("custom-studio");

        function getSelectedBudget() {
          const checked = document.querySelector('input[name="journey-budget"]:checked');
          return checked ? checked.value : "";
        }

        function getSelectedRegion() {
          const checked = document.querySelector('input[name="journey-region"]:checked');
          return checked ? checked.value : "";
        }

        function getDestinationLabel(region) {
          if (!selectedHotel) return region;
          const hotel = REGION_PRICING[region]?.defaultHotel === selectedHotel.name
            ? '숙소 ' + selectedHotel.name : selectedHotel.name;
          return `${region} (${hotel})`;
        }

        const studioPlanSelect = document.getElementById('studio-plan');
        let renderedStudioBase = null;
        function getStudioBase() {
          return document.querySelector('input[name="journey-studio"]:checked')?.value || '';
        }
        function getStudioPricing() {
          const item = STUDIO_CATALOG[getStudioBase()];
          if (!item) return null;
          const plan = item.plans.find(p => p.id === studioPlanSelect.value);
          return { ...item, start: plan?.start ?? item.start, plan };
        }
        function renderStudioPlans() {
          const base = getStudioBase();
          const item = STUDIO_CATALOG[base];
          const field = document.getElementById('studio-plan-field');
          field.hidden = !item || item.plans.length < 2;
          if (base === renderedStudioBase) return;
          renderedStudioBase = base;
          studioPlanSelect.replaceChildren(new Option('구성은 상담하면서 정할게요', ''));
          item?.plans.forEach(plan => studioPlanSelect.add(new Option(plan.name + ' · ' + plan.start + '만원~', plan.id)));
        }
        studioPlanSelect.addEventListener('change', syncAllSelections);

        function getSelectedStudio() {
          const checked = document.querySelector('input[name="journey-studio"]:checked');
          if (!checked) return "";
          if (checked.value === "custom") {
            const customVal = customStudioInput ? customStudioInput.value.trim() : "";
            return customVal ? `${customVal} (직접 입력)` : "";
          }
          return getStudioPricing()?.plan?.name || checked.value;
        }

        function selectionLabel(value, isStudio = false) {
          if (isStudio && getStudioBase() === 'custom' && !value) return '이름 입력 전';
          return value === '아직 미정' ? '상담 후 결정' : value || '선택 전';
        }

        function syncAllSelections() {
          renderStudioPlans();
          const budgetVal = getSelectedBudget();
          const regionVal = getSelectedRegion();
          const studioVal = getSelectedStudio();
          const studioNote = getStudioPricing()?.note;
          const studioCondition = studioVal + (studioNote ? ' (' + studioNote + ')' : '');

          const regionWithHotel = getDestinationLabel(regionVal);

          const customField = document.getElementById("custom-studio-field");
          if (customField) customField.hidden = !document.querySelector('input[name="journey-studio"][value="custom"]').checked;
          if (quoteRegionText) quoteRegionText.textContent = selectionLabel(regionWithHotel);
          if (quoteStudioText) quoteStudioText.textContent = selectionLabel(studioCondition, true);
          if (quoteBudgetText) quoteBudgetText.textContent = selectionLabel(budgetVal);
          [[quoteRegionText, regionVal], [quoteStudioText, studioVal], [quoteBudgetText, budgetVal]].forEach(([element, value]) => {
            element?.classList.toggle('is-pending', !value || value === '아직 미정');
          });

          if (hiddenRegion) hiddenRegion.value = regionWithHotel;
          if (hiddenStudio) hiddenStudio.value = studioVal === "아직 미정" ? "" : studioCondition;
          if (hiddenBudget) hiddenBudget.value = budgetVal === "아직 미정" ? "" : budgetVal;

          syncQuoteEditors();
          updateComparisonReceipt();
        }

        document.querySelectorAll('input[name="journey-budget"]').forEach((input) => {
          input.addEventListener("change", () => {
            const firstSelection = !budgetAdvanceUsed;
            budgetAdvanceUsed = true;
            syncAllSelections();
            if (firstSelection && !getSelectedRegion()) revealNextQuestion(1);
          });
        });

        document.querySelectorAll('input[name="journey-region"]').forEach((input) => {
          input.addEventListener("change", () => {
            selectDestination(input.value);
            if (input.value === '아직 미정') revealNextQuestion(2);
          });
        });

        document.querySelectorAll('input[name="journey-studio"]').forEach((input) => {
          input.addEventListener("change", () => {
            syncAllSelections();
            if (input.value === 'custom') customStudioInput.focus();
          });
        });

        if (customStudioInput) {
          customStudioInput.addEventListener("focus", () => {
            const customRadio = document.querySelector('input[name="journey-studio"][value="custom"]');
            if (customRadio) {
              customRadio.checked = true;
              syncAllSelections();
            }
          });
          customStudioInput.addEventListener("input", syncAllSelections);
        }

        document.querySelectorAll(".hero-destination[data-region]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const region = btn.getAttribute("data-region");
            selectDestination(region);
            goToQuestion(1, true);
          });
        });

        const studioFilterBtns = Array.from(document.querySelectorAll("[data-studio-area]")).filter(
          (el) => el.tagName === "BUTTON"
        );
        const studioItems = Array.from(document.querySelectorAll(".studio-choice[data-studio-area]"));
        let currentStudioArea = "전체";
        function renderStudioFilter() {
          studioFilterBtns.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.studioArea === currentStudioArea));
          });
          studioItems.forEach(item => {
            item.hidden = currentStudioArea !== "전체" && item.dataset.studioArea !== currentStudioArea;
          });
        }
        function showChosenStudio(name) {
          const area = studioAreas.get(name);
          if (area && currentStudioArea !== '전체' && currentStudioArea !== area) {
            currentStudioArea = area;
            renderStudioFilter();
          }
        }

        studioFilterBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            currentStudioArea = btn.getAttribute("data-studio-area") || "전체";
            renderStudioFilter();
          });
        });


        const studioPicker = document.getElementById("comparison-studio");
        const compDropdown = document.querySelector(".region-dropdown");
        const compRegionCurrent = document.getElementById("comparison-region-current");

        const studioAreas = new Map(studioItems.map(item => [
          item.querySelector('input').value, item.dataset.studioArea
        ]));
        const pickerAreas = studioPicker.querySelector('.studio-picker-areas');
        const pickerList = studioPicker.querySelector('.studio-picker-list');
        let browsingArea = studioAreas.values().next().value;

        function filterComparisonStudios(area) {
          browsingArea = area;
          for (const button of pickerAreas.children) {
            button.setAttribute('aria-pressed', String(button.textContent === area));
          }
          let count = 0;
          for (const row of pickerList.children) {
            row.hidden = studioAreas.get(row.value) !== area;
            if (!row.hidden) count++;
          }
          document.getElementById('studio-picker-area-name').textContent = area + ' · ' + count + '곳';
          pickerList.parentElement.scrollTop = 0;
        }

        for (const area of new Set(studioAreas.values())) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = area;
          button.addEventListener('click', () => filterComparisonStudios(area));
          pickerAreas.append(button);
        }
        const sortedNames = [...studioAreas.keys()].sort((a, b) =>
          STUDIO_CATALOG[a].start - STUDIO_CATALOG[b].start || a.localeCompare(b, 'ko')
        );
        for (const name of sortedNames) {
          const row = document.createElement('button');
          row.type = 'button';
          row.value = name;
          const label = document.createElement('span');
          label.textContent = name;
          const { start, note } = STUDIO_CATALOG[name];
          if (note) {
            const exception = document.createElement('small');
            exception.textContent = note;
            label.append(exception);
          }
          const price = document.createElement('b');
          price.textContent = start;
          const mark = document.createElement('span');
          mark.className = 'studio-pick';
          mark.setAttribute('aria-hidden', 'true');
          row.setAttribute('aria-label', name + ', 개별 시작가 ' + start + '만원' + (note ? ', ' + note : ''));
          row.append(label, price, mark);
          row.addEventListener('click', () => {
            const radio = studioItems.find(item => item.querySelector('input').value === name).querySelector('input');
            radio.checked = true;
            showChosenStudio(name);
            syncAllSelections();
            studioPicker.open = false;
            studioPicker.querySelector('summary').focus({ preventScroll: true });
          });
          pickerList.append(row);
        }
        studioPicker.addEventListener('toggle', () => {
          if (studioPicker.open) filterComparisonStudios(studioAreas.get(getStudioBase()) || browsingArea);
        });
        studioPicker.addEventListener('keydown', event => {
          if (event.key !== 'Escape' || !studioPicker.open) return;
          studioPicker.open = false;
          studioPicker.querySelector('summary').focus({ preventScroll: true });
        });
        filterComparisonStudios(browsingArea);

        const journeyRegions = [...document.querySelectorAll('input[name="journey-region"]')];
        const comparisonRegions = [...document.querySelectorAll('input[name="comparison-region"]')];

        // All entry points share one destination and, when applicable, one hotel.
        function selectDestination(region, hotel = selectedHotel) {
          const pricing = REGION_PRICING[region];
          // Region-only choices still carry a canonical hotel value for consultation and storage.
          selectedHotel = pricing?.defaultHotel
            ? { region, name: pricing.defaultHotel, bundleStart: pricing.bundleStart }
            : hotel?.region === region ? hotel : null;
          journeyRegions.forEach(input => { input.checked = input.value === region; });
          comparisonRegions.forEach(input => { input.checked = input.value === region; });
          const selected = comparisonRegions.find(input => input.checked);
          if (selected) {
            compRegionCurrent.textContent = region;
          } else {
            compRegionCurrent.textContent = region === '아직 미정' ? '상담 후 결정' : '여행지를 선택해 주세요';
          }
          expandSelectedHotels(region);
          reflectSelectedHotel();
          syncAllSelections();
          document.getElementById('journey-selection-note').textContent = pricing
            ? `${getDestinationLabel(region)} 선택. 허니문 2인과 웨딩촬영 1회, ${selectedHotel?.bundleStart ?? pricing.bundleStart}만원부터.`
            : region === '아직 미정' ? '여행지는 상담 후 결정합니다.' : '';
        }

        function closeRegionDropdown(returnFocus = false) {
          compDropdown.open = false;
          if (returnFocus) compDropdown.querySelector('summary').focus({ preventScroll: true });
        }
        comparisonRegions.forEach((radio) => {
          radio.addEventListener('change', () => selectDestination(radio.value));
          radio.addEventListener('click', (event) => {
            // Keep the list open while moving through native radios with arrow keys.
            if (event.detail > 0) closeRegionDropdown(true);
          });
        });
        compDropdown.addEventListener('keydown', (event) => {
          if (!compDropdown.open) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            closeRegionDropdown(true);
          } else if (event.key === 'Enter' && event.target.matches('input[name="comparison-region"]')) {
            event.preventDefault();
            selectDestination(event.target.value);
            closeRegionDropdown(true);
          }
        });
        compDropdown.addEventListener('focusout', (event) => {
          if (event.relatedTarget && !compDropdown.contains(event.relatedTarget)) closeRegionDropdown();
        });
        document.addEventListener('pointerdown', (event) => {
          if (compDropdown.open && !compDropdown.contains(event.target)) closeRegionDropdown();
        });

        const extraChoices = Array.from(document.querySelectorAll('input[name="journey-extra"]'));
        const extrasNone = document.getElementById('extras-none');
        function clearExtras() {
          extrasDecisionMade = extrasNone.checked;
          selectedExtras.clear();
          extraChoices.forEach(input => { input.checked = false; });
          updateComparisonReceipt();
        }
        extraChoices.forEach(input => input.addEventListener('change', () => {
          if (input.checked) selectedExtras.add(input.value);
          else selectedExtras.delete(input.value);
          extrasDecisionMade = selectedExtras.size > 0;
          updateComparisonReceipt();
        }));
        extrasNone.addEventListener('change', clearExtras);

        function updateComparisonReceipt() {
          const regionName = getSelectedRegion();
          const studioName = getSelectedStudio();
          const regionInfo = REGION_PRICING[regionName] || null;
          const hasRegion = Boolean(regionInfo);
          const hasStudio = Boolean(studioName && studioName !== "아직 미정");
          const baseStudio = getStudioBase();
          const studioPricing = getStudioPricing();
          const regionDisplay = hasRegion
            ? getDestinationLabel(regionName)
            : '여행지 미정';
          // The published bundle start never changes with a studio or review-item selection.
          const bundleStart = hasRegion ? (selectedHotel?.bundleStart ?? regionInfo.bundleStart) : null;
          const conditions = document.getElementById('comparison-filters');
          document.getElementById('comparison-results').hidden = !hasRegion;
          if (!hasRegion) conditions.open = true;
          document.getElementById('comparison-entry-label').textContent = hasRegion || hasStudio ? '선택한 구성' : '확인할 구성';
          document.getElementById('comparison-combination').textContent = !hasRegion && !hasStudio
            ? '여행지부터 골라주세요'
            : [regionDisplay, hasStudio ? studioName : '스튜디오 ' + selectionLabel(studioName, true)].join(' · ');
          document.getElementById('comparison-readiness').textContent = !hasRegion
            ? '여행지를 고르면 비교 내용을 볼 수 있어요.'
            : !hasStudio ? '스튜디오를 고르면 개별 계약 시작가도 확인할 수 있어요.' : '선택한 조건이 아래 비교 내용에 반영됐어요.';
          const area = studioAreas.get(baseStudio);
          document.getElementById('studio-picker-value').textContent = area
            ? area + ' · ' + studioName
            : baseStudio === '아직 미정' ? '상담 후 결정' : studioName || '지역별 스튜디오 보기';
          for (const row of pickerList.querySelectorAll('button')) {
            row.setAttribute('aria-pressed', String(row.value === baseStudio));
          }
          function renderStudioRate(id) {
            const target = document.getElementById(id);
            target.textContent = studioPricing ? studioPricing.start + '만원~' : hasStudio ? '상담 후 안내' : '스튜디오 선택 전';
            target.classList.toggle('is-empty', !studioPricing);
            if (studioPricing?.note) {
              const note = document.createElement('small');
              note.className = 'studio-rate-note';
              note.textContent = studioPricing.note;
              target.append(note);
            }
          }
          const individualTrip = hasRegion ? bundleStart - 30 : null;
          document.getElementById('individual-trip').textContent = hasRegion ? '2인 ' + individualTrip + '만원부터' : '여행지 선택 전';
          document.getElementById('individual-total').textContent = hasRegion && studioPricing
            ? (individualTrip + studioPricing.start).toLocaleString('ko-KR') + '만원부터'
            : hasStudio ? '촬영가 상담 후 안내' : '스튜디오 선택 시 확인';
          renderStudioRate('comparison-studio-start');
          document.getElementById('live-studio-start-row').hidden = !studioPricing;
          renderStudioRate('live-studio-start');
          document.getElementById('comparison-bundle').innerHTML = hasRegion
            ? '<strong>' + bundleStart + '</strong>만원<small>부터</small>' : '여행지 선택 전';

          // Addon preferences carry the source price range; bundled charges are not counted twice.
          const extraNames = Array.from(selectedExtras);
          const extraPrice = name => extraChoices.find(input => input.value === name)?.dataset.price || '금액 상담 안내';
          const extraConditions = extraNames.map(name => name + ' (' + extraPrice(name) + ')');
          document.getElementById('extra-review-status').textContent = extraNames.length
            ? '추가 항목 ' + extraNames.length + '개 선택'
            : extrasDecisionMade ? '추가 항목 없이 진행' : '';
          extrasNone.checked = extrasDecisionMade && !extraNames.length;
          const extraPanel = document.getElementById('comparison-selected-extras');
          extraPanel.hidden = !extraNames.length;
          document.getElementById('comparison-extra-count').textContent = extraNames.length + '개';
          const extraItems = document.getElementById('comparison-extra-items');
          extraItems.replaceChildren();
          extraNames.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name + ' · ' + extraPrice(name);
            extraItems.append(li);
          });
          document.getElementById('quote-extras-row').hidden = !extraNames.length;
          document.getElementById('quote-extras-text').textContent = extraConditions.join(' · ');
          document.getElementById('extras-value').value = extraConditions.join(', ');

          const budget = getSelectedBudget();
          document.getElementById('live-calc-region').textContent = hasRegion ? regionDisplay : selectionLabel(regionName);
          document.getElementById('live-calc-studio').textContent = selectionLabel(studioName, true);
          document.getElementById('live-calc-budget').textContent = selectionLabel(budget);
          [['live-calc-region', regionName], ['live-calc-studio', studioName], ['live-calc-budget', budget]].forEach(([id, value]) => {
            document.getElementById(id).classList.toggle('is-pending', !value || value === '아직 미정');
          });
          const liveExtras = document.getElementById('live-calc-extras');
          liveExtras.parentElement.hidden = !extraNames.length;
          liveExtras.textContent = extraNames.length + '개';
          const liveExtraNames = document.getElementById('live-calc-extra-names');
          liveExtraNames.hidden = !extraNames.length;
          liveExtraNames.replaceChildren();
          extraNames.forEach(name => {
            const li = document.createElement('li');
            const label = document.createElement('span');
            const price = document.createElement('span');
            label.textContent = name;
            price.textContent = extraPrice(name);
            li.append(label, price);
            liveExtraNames.append(li);
          });
          const liveTotal = document.getElementById('live-calc-total');
          liveTotal.textContent = hasRegion ? String(bundleStart) : '여행지 선택 전';
          liveTotal.classList.toggle('is-empty', !hasRegion);
          document.getElementById('live-calc-unit').hidden = !hasRegion;
          const receiptCta = document.querySelector('.calc-receipt-cta');
          receiptCta.textContent = hasRegion ? '이 조건으로 무료 견적받기' : '여행지 고르기';
          receiptCta.classList.toggle('is-choice-link', !hasRegion);
          receiptCta.href = hasRegion ? '#consult-form' : '#journey-panel-1';
          document.getElementById('live-calc-hint').hidden = hasRegion;
          document.getElementById('live-calc-price-note').hidden = !hasRegion;

          const summary = hasRegion ? regionDisplay + ' · ' + bundleStart + '만원부터' :
            [budget && budget !== '아직 미정' ? '총예산 ' + budget : '', hasStudio ? studioName : '',
              extraNames.length ? '추가 항목 ' + extraNames.length + '개' : ''].filter(Boolean).join(' · ');
          updateShortcut(summary);
          formResult.hidden = true;
        }

        document.getElementById("quote-extras-edit")?.addEventListener("click", () => {
          goToQuestion(3, true);
        });


        // Compact consultation editors share the calculator selection, without a second copy of state.
        const quoteEditors = [
          { index: 0, kind: 'budget', label: '총예산' },
          { index: 1, kind: 'region', label: '여행지' },
          { index: 2, kind: 'studio', label: '웨딩촬영' }
        ];
        const quoteStudioSelect = document.getElementById('quote-studio-select');
        const quoteCustomInput = document.getElementById('quote-custom-studio');
        const quotePlanSelect = document.getElementById('quote-studio-plan');
        const quoteCustomDone = document.getElementById('quote-custom-done');
        STUDIO_NAMES.forEach(name => quoteStudioSelect.add(new Option(name, name)));

        function closeQuoteEditors() {
          quoteEditors.forEach(({index, kind}) => {
            document.getElementById('quote-editor-' + kind).hidden = true;
            document.querySelector(`[data-quote-edit="${index}"]`).setAttribute('aria-expanded', 'false');
          });
        }
        function finishQuoteChoice(index) {
          closeQuoteEditors();
          document.querySelector(`[data-quote-edit="${index}"]`).focus({preventScroll:true});
        }
        function bindQuoteSelect(select, applyChoice, confirmChoice) {
          let keyboardSelection = false;
          select.addEventListener('pointerdown', () => { keyboardSelection = false; });
          select.addEventListener('keydown', event => {
            if (event.isComposing) return;
            keyboardSelection = true;
            if (event.key !== 'Enter') return;
            event.preventDefault();
            applyChoice();
            confirmChoice();
          });
          select.addEventListener('change', () => {
            applyChoice();
            if (!keyboardSelection) confirmChoice();
          });
        }
        function syncQuoteEditors() {
          let selectedCount = 0;
          quoteEditors.forEach(({index, kind, label}) => {
            const selected = document.querySelector(`input[name="journey-${kind}"]:checked`);
            const select = document.getElementById('quote-' + kind + '-select');
            select.value = selected?.value || '';
            if (selected) selectedCount++;
            const button = document.querySelector(`[data-quote-edit="${index}"]`);
            const action = selected ? '변경' : '선택하기';
            button.textContent = action;
            button.setAttribute('aria-label', label + ' ' + action);
          });
          document.getElementById('quote-selection-heading').textContent = selectedCount ? '선택한 구성' : '문의할 구성';
          document.getElementById('quote-selection-help').textContent = selectedCount ? '이 조건으로 상담해 드려요.' : '정해진 항목만 선택해 주세요.';
          document.getElementById('quote-custom-field').hidden = getStudioBase() !== 'custom';
          quoteCustomDone.hidden = getStudioBase() !== 'custom';
          if (quoteCustomInput.value !== customStudioInput.value) quoteCustomInput.value = customStudioInput.value;
          const planField = document.getElementById('quote-plan-field');
          planField.hidden = document.getElementById('studio-plan-field').hidden;
          const planOptions = Array.from(studioPlanSelect.options);
          if (quotePlanSelect.options.length !== planOptions.length || planOptions.some((option, index) => {
            const existing = quotePlanSelect.options[index];
            return existing?.value !== option.value || existing.textContent !== option.textContent;
          })) {
            quotePlanSelect.replaceChildren(...planOptions.map(option => new Option(option.textContent, option.value)));
          }
          quotePlanSelect.value = studioPlanSelect.value;
        }
        quoteEditors.forEach(({index, kind}) => {
          const button = document.querySelector(`[data-quote-edit="${index}"]`);
          const editor = document.getElementById('quote-editor-' + kind);
          const select = document.getElementById('quote-' + kind + '-select');
          button.addEventListener('click', () => {
            const willOpen = editor.hidden;
            closeQuoteEditors();
            if (!willOpen) return;
            editor.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            select.focus({preventScroll:true});
          });
          editor.addEventListener('focusout', event => {
            if (!event.relatedTarget || event.relatedTarget === button || editor.contains(event.relatedTarget)) return;
            editor.hidden = true;
            button.setAttribute('aria-expanded', 'false');
          });
          bindQuoteSelect(select, () => {
            const current = document.querySelector(`input[name="journey-${kind}"]:checked`);
            if (current?.value === select.value) return;
            if (kind === 'region') {
              selectDestination(select.value);
              return;
            }
            let chosen;
            document.querySelectorAll(`input[name="journey-${kind}"]`).forEach(input => {
              input.checked = input.value === select.value;
              if (input.checked) chosen = input;
            });
            if (kind === 'budget' && chosen) budgetAdvanceUsed = true;
            if (kind === 'studio' && chosen) showChosenStudio(chosen.value);
            syncAllSelections();
          }, () => {
            const chosen = document.querySelector(`input[name="journey-${kind}"]:checked`);
            if (!chosen) return;
            if (kind === 'studio') {
              if (chosen.value === 'custom') { quoteCustomInput.focus({preventScroll:true}); return; }
              if (STUDIO_CATALOG[chosen.value]?.plans.length > 1) {
                quotePlanSelect.focus({preventScroll:true});
                return;
              }
            }
            finishQuoteChoice(index);
          });
        });
        function finishCustomStudio() {
          if (!quoteCustomInput.value.trim()) {
            quoteCustomInput.setCustomValidity('스튜디오 이름을 입력하거나 상담 후 결정을 선택해 주세요.');
            quoteCustomInput.reportValidity();
            return;
          }
          finishQuoteChoice(2);
        }
        quoteCustomDone.addEventListener('click', finishCustomStudio);
        quoteCustomInput.addEventListener('keydown', event => {
          if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); finishCustomStudio(); }
        });
        quoteCustomInput.addEventListener('input', () => {
          quoteCustomInput.setCustomValidity('');
          customStudioInput.value = quoteCustomInput.value;
          syncAllSelections();
        });
        bindQuoteSelect(quotePlanSelect, () => {
          studioPlanSelect.value = quotePlanSelect.value;
          syncAllSelections();
        }, () => finishQuoteChoice(2));
        document.querySelectorAll('.quote-inline-editor a').forEach(link => link.addEventListener('click', closeQuoteEditors));

        const phoneInput = document.getElementById("customer-phone");
        if (phoneInput) {
          phoneInput.addEventListener("input", (e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
            if (digits.length < 4) e.target.value = digits;
            else if (digits.length < 8) e.target.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
            else e.target.value = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
          });
        }

        const consultForm = document.getElementById("consult-form");
        const nameInput = document.getElementById("customer-name");
        const nameError = document.getElementById("name-error");
        const phoneError = document.getElementById("phone-error");
        const formResult = document.getElementById("form-result");
        const resetFormBtn = document.getElementById("reset-form");

        if (consultForm) {
          for (const [field, message] of [[nameInput, nameError], [phoneInput, phoneError]]) {
            field.addEventListener('input', () => {
              field.removeAttribute('aria-invalid');
              message.textContent = '';
            });
          }
          consultForm.addEventListener('input', () => { formResult.hidden = true; });
          consultForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            let valid = true;
            if (nameError) nameError.textContent = "";
            if (phoneError) phoneError.textContent = "";

            if (!nameInput || !nameInput.value.trim()) {
              if (nameError) nameError.textContent = "이름을 입력해 주세요.";
              nameInput?.setAttribute('aria-invalid', 'true');
              nameInput?.focus();
              valid = false;
            }

            const phoneDigits = phoneInput ? phoneInput.value.replace(/\D/g, "") : "";
            if (phoneDigits.length < 10) {
              if (phoneError) phoneError.textContent = "올바른 휴대폰 번호를 입력해 주세요.";
              phoneInput?.setAttribute('aria-invalid', 'true');
              if (valid) phoneInput?.focus();
              valid = false;
            }

            if (!valid) return;
            const outcome = await window.HoneysLeads.submit({
              name: nameInput.value.trim(), phone: phoneInput.value,
              channel: consultForm.querySelector('input[name="contactChannel"]:checked').value,
              region: getSelectedRegion(), hotel: selectedHotel?.name || '',
              studioBase: getStudioBase(), studioPlanId: studioPlanSelect.value,
              customStudio: customStudioInput.value.trim(), budget: getSelectedBudget(),
              extras: [...selectedExtras], weddingMonth: document.getElementById('wedding-month').value,
              request: document.getElementById('request').value,
              compareExisting: document.getElementById('compare-existing').checked,
              page: location.origin + location.pathname
            });
            if (outcome !== 'preview') return;
            if (formResult) {
              formResult.hidden = false;
              formResult.focus();
            }
          });
        }

        if (resetFormBtn && consultForm) {
          resetFormBtn.addEventListener("click", () => {
            window.HoneysLeads.clear();
            consultForm.reset();
            if (customStudioInput) customStudioInput.value = '';
            selectedExtras.clear();
            extrasDecisionMade = false;
            budgetAdvanceUsed = false;
            extraChoices.forEach(input => { input.checked = false; });
            studioPlanSelect.value = '';
            renderedStudioBase = null;
            document.querySelectorAll('input[name="journey-budget"], input[name="journey-studio"]').forEach(r => {
              r.checked = false;
            });
            currentStudioArea = '전체';
            renderStudioFilter();
            filterComparisonStudios(studioAreas.values().next().value);
            studioPicker.open = false;
            compDropdown.open = false;
            if (formResult) formResult.hidden = true;
            closeQuoteEditors();
            quoteCustomInput.setCustomValidity('');
            selectDestination('');
            nameInput.focus({preventScroll: true});
          });
        }

        const creditsOpen = document.getElementById("credits-open");
        const creditsClose = document.getElementById("credits-close");
        const creditsDialog = document.getElementById("credits-dialog");

        creditsOpen?.addEventListener("click", () => creditsDialog?.showModal?.());
        creditsClose?.addEventListener("click", () => creditsDialog?.close());
        creditsDialog?.addEventListener("click", (e) => {
          if (e.target === creditsDialog) creditsDialog.close();
        });

        const comparisonFilters = document.getElementById("comparison-filters");
        document.querySelector('#journey-guide a').addEventListener('click', () => {
          document.getElementById('journey-guide').open = false;
        });
        comparisonFilters.addEventListener('toggle', () => {
          document.getElementById('comparison-edit-label').textContent = comparisonFilters.open ? '접기' : '조건 변경';
        });
        function prepareComparison() {
          comparisonFilters.open = document.getElementById('comparison-results').hidden;
        }
        document.querySelectorAll('a[href="#comparison"]').forEach(link => {
          link.addEventListener("click", prepareComparison);
        });
        // Adapt on first arrival by scrolling, without closing a form the visitor is editing.
        const comparisonObserver = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          if (!comparisonFilters.contains(document.activeElement)) prepareComparison();
          comparisonObserver.disconnect();
        }, {threshold: 0.1});
        comparisonObserver.observe(document.getElementById("comparison-filters"));

        const updateShortcut = initPageNavigation(scrollBehavior);
        renderStudioFilter();
        reflectSelectedHotel();
        syncAllSelections();
      });
    

(function(){
  if (!document.documentElement.classList.contains('honeys-on-phone')) return;
  const root=document.documentElement;
  const vp=document.querySelector('meta[name="viewport"]');
  const control=document.getElementById('honeys-view-switch');
  const caption=document.getElementById('honeys-view-switch-label');
  if(!control || !vp || !caption) return;
  function render(){
    const preview=root.classList.contains('honeys-pc-preview');
    caption.textContent=preview ? '모바일 보기' : 'PC 레이아웃 보기';
    control.setAttribute('aria-pressed', String(preview));
    control.setAttribute('title',preview?'모바일 맞춤 화면으로 보기':'데스크톱 레이아웃을 축소해서 보기');
    control.querySelector('svg').innerHTML=preview
      ? '<rect x="7" y="2.5" width="10" height="19" rx="1.6"/><path d="M11 18.5h2"/>'
      : '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8m-4-4v4"/>';
  }
  control.addEventListener('click',()=>{
    const desktop=!root.classList.contains('honeys-pc-preview');
    root.classList.toggle('honeys-pc-preview',desktop);
    vp.content=desktop
      ? 'width=1120, viewport-fit=cover, user-scalable=yes'
      : 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes';
    try {sessionStorage.setItem('honeys-layout-mode',desktop?'desktop':'mobile');}catch(e){}
    render();
  });
  render();
})();

// One fixed shortcut reflects the active quote. Only an explicit submit click validates the form.
function initPageNavigation(scrollBehavior) {
  const header = document.querySelector('.section-nav');
  const menu = document.getElementById('page-menu');
  const toggle = header.querySelector('.nav-toggle');
  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const navSections = links.map(link => document.querySelector(link.hash));
  const form = document.getElementById('consult-form');
  const dockSub = document.getElementById('dock-sub-text');
  const dockMain = document.getElementById('dock-main-text');
  const dockAction = document.getElementById('dock-action');
  let summary = '';
  let atForm = false;
  let pointerAction = null;
  let scheduled = false;

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.classList.contains('is-open')) return;
    setMenu(false);
    toggle.focus({preventScroll: true});
  });
  document.addEventListener('pointerdown', event => {
    if (menu.classList.contains('is-open') && !header.contains(event.target)) setMenu(false);
  });

  function update() {
    scheduled = false;
    const edge = header.getBoundingClientRect().bottom;
    const formRect = form.getBoundingClientRect();
    if (atForm) {
      atForm = formRect.top < innerHeight && formRect.bottom > edge + 24;
    } else {
      atForm = formRect.top < innerHeight * 0.6 && formRect.bottom > edge + 80;
    }
    const sub = atForm ? '무료 견적 상담' : '허니문 2인 + 웨딩촬영 1회';
    const main = atForm ? '견적을 확인한 뒤 결정하세요' : summary || '정해진 내용만 알려주세요';
    if (dockSub.textContent !== sub) dockSub.title = dockSub.textContent = sub;
    if (dockMain.textContent !== main) dockMain.title = dockMain.textContent = main;
    const label = atForm ? '무료 견적 상담 신청' : summary ? '이 조건으로 견적받기' : '무료 견적 상담';
    dockAction.dataset.action = atForm ? 'submit' : 'consult';
    if (dockAction.dataset.label !== label) {
      dockAction.dataset.label = label;
      dockAction.innerHTML = label + ' <span aria-hidden="true">→</span>';
    }

    const readingLine = edge + 80;
    links.forEach((link, index) => {
      const bounds = navSections[index].getBoundingClientRect();
      if (bounds.top <= readingLine && readingLine < bounds.bottom) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(document.querySelector('main'));
  dockAction.addEventListener('pointerdown', () => { pointerAction = dockAction.dataset.action; });
  dockAction.addEventListener('pointercancel', () => { pointerAction = null; });
  dockAction.addEventListener('pointerleave', () => { pointerAction = null; });
  dockAction.addEventListener('click', () => {
    const action = pointerAction || dockAction.dataset.action;
    pointerAction = null;
    if (action === 'submit') {
      form.requestSubmit();
      return;
    }
    form.scrollIntoView({behavior: scrollBehavior(), block: 'start'});
    form.querySelector('h3').focus({preventScroll: true});
  });
  return selection => {
    summary = selection;
    schedule();
  };
}
